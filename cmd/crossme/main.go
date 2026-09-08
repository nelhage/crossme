package main

import (
	"context"
	"flag"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"crossme.app/src/auth"
	"crossme.app/src/fly"
	"crossme.app/src/pb/pbconnect"
	"crossme.app/src/repo"
	"crossme.app/src/seed"
	"crossme.app/src/server"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
)

func main() {
	var (
		bind = flag.String("bind", "localhost:4000", "bind address")
		db   = flag.String("db", "/crossme:", "MySQL DSN")

		// Google login is optional: leave the client id unset and the
		// server runs anonymous-only, with no auth routes at all.
		googleClientID = flag.String("google-client-id",
			os.Getenv("CROSSME_GOOGLE_CLIENT_ID"),
			"Google OAuth client ID; empty disables Google login")
		googleClientSecret = flag.String("google-client-secret",
			os.Getenv("CROSSME_GOOGLE_CLIENT_SECRET"),
			"Google OAuth client secret")
		baseURL = flag.String("base-url",
			envDefault("CROSSME_BASE_URL", "http://localhost:3000"),
			"external base URL the browser reaches us at, for OAuth redirects")

		// Preview login (auth/broker.go). A preview instance signs users
		// in through production instead of Google: -login-via names the
		// production deployment to go through, and needs the Fly agent
		// socket to prove which preview we are. Production, in turn,
		// enables the brokering side with -preview-login-issuer, the Fly
		// OIDC issuer for the organization the previews run in; it then
		// hands identities to any Machine of an app matching
		// -preview-login-apps, reachable at https://<app>.fly.dev.
		loginVia = flag.String("login-via",
			os.Getenv("CROSSME_LOGIN_VIA"),
			"base URL of a crossme deployment to sign users in through (previews only); empty disables")
		previewLoginIssuer = flag.String("preview-login-issuer",
			os.Getenv("CROSSME_PREVIEW_LOGIN_ISSUER"),
			"Fly OIDC issuer (https://oidc.fly.io/<org>) whose preview Machines may sign users in through us; empty disables")
		previewLoginApps = flag.String("preview-login-apps",
			envDefault("CROSSME_PREVIEW_LOGIN_APPS", "crossme-pr-*"),
			"pattern the Fly app name of a preview must match for -preview-login-issuer")

		// In production nginx serves the built client and proxies /api/ here.
		// Preview instances run everything in one container instead, so we can
		// optionally serve the bundle ourselves; empty means we don't.
		staticDir = flag.String("static-dir",
			os.Getenv("CROSSME_STATIC_DIR"),
			"directory of built client assets to serve at /; empty disables static serving")

		// Preview instances have no durable storage and start from a
		// snapshot of production instead, fetched from GCS on first boot;
		// see the seed package. Both are empty outside previews.
		seedFrom = flag.String("seed-from",
			os.Getenv("CROSSME_SEED_FROM"),
			"gs://bucket/object to copy the database from if it doesn't exist yet; empty disables seeding")
		gcpIdentityProvider = flag.String("gcp-identity-provider",
			os.Getenv("CROSSME_GCP_IDENTITY_PROVIDER"),
			"Workload Identity Federation provider (//iam.googleapis.com/projects/...) that trusts this Fly app, for -seed-from")
	)
	flag.Parse()

	if *seedFrom != "" {
		// The DSN is a path with optional ?options; seeding wants the path.
		dbPath, _, _ := strings.Cut(*db, "?")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		err := seed.Ensure(ctx, dbPath, seed.Options{
			Source:           *seedFrom,
			IdentityProvider: *gcpIdentityProvider,
		})
		cancel()
		if err != nil {
			log.Fatal("seeding database: ", err)
		}
	}

	r, err := repo.Open(*db)
	if err != nil {
		log.Fatal("open db: ", err)
	}

	srv := server.New(r)

	var providers []auth.Provider
	if *googleClientID != "" {
		google, err := auth.NewGoogle(context.Background(),
			*googleClientID, *googleClientSecret,
			*baseURL+"/api/auth/google/callback")
		if err != nil {
			log.Fatal("configuring Google login: ", err)
		}
		providers = append(providers, google)
		log.Printf("Google login enabled (redirect base %s)", *baseURL)
	}
	if *loginVia != "" {
		tokens := func(ctx context.Context, audience string) (string, error) {
			return fly.OIDCToken(ctx, fly.DefaultSocket, audience)
		}
		providers = append(providers,
			auth.NewCrossMe(*loginVia, *baseURL+"/api/auth/"+auth.CrossMeProviderName+"/callback", tokens))
		log.Printf("login via %s enabled (redirect base %s)", *loginVia, *baseURL)
	}
	authHandler := auth.NewHandler(r, providers...)
	srv.SetLoginProviders(authHandler.ProviderNames())

	mux := http.NewServeMux()
	if len(providers) > 0 {
		authHandler.Register(mux)
	}
	if *previewLoginIssuer != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		clients, err := fly.NewVerifier(ctx, *previewLoginIssuer, *baseURL)
		cancel()
		if err != nil {
			log.Fatal("configuring preview login: ", err)
		}
		broker, err := authHandler.NewBroker(auth.BrokerConfig{
			BaseURL:    *baseURL,
			AppPattern: *previewLoginApps,
			Clients:    clients,
		})
		if err != nil {
			log.Fatal("configuring preview login: ", err)
		}
		broker.Register(mux)
		log.Printf("preview login enabled for %s apps %s", *previewLoginIssuer, *previewLoginApps)
	}

	// Health check for the container runtime. It lives outside /api/ so nginx
	// doesn't expose it, and it touches the database so that a server which
	// has lost its sqlite file reports unhealthy instead of merely accepting
	// connections.
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, req *http.Request) {
		ctx, cancel := context.WithTimeout(req.Context(), 2*time.Second)
		defer cancel()
		if err := r.Ping(ctx); err != nil {
			log.Printf("healthz: %v", err)
			http.Error(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		w.Header().Set("Content-Type", "text/plain")
		io.WriteString(w, "ok\n")
	})

	path, handler := pbconnect.NewCrossMeHandler(srv)
	// The web client reaches us under /api/, both through the vite dev
	// server and through nginx in production. The auth middleware
	// resolves the session cookie (if any) so RPC handlers know who is
	// calling.
	mux.Handle("/api"+path, http.StripPrefix("/api", authHandler.Middleware(handler)))

	if *staticDir != "" {
		spa, err := newSPAHandler(*staticDir)
		if err != nil {
			log.Fatal("-static-dir: ", err)
		}
		// An unmatched path under /api/ is an API error, not a client-side
		// route; without this it would fall through to the catch-all below and
		// answer with the app shell. The API and /healthz patterns registered
		// above are more specific, so they still win.
		mux.Handle("/api/", http.NotFoundHandler())
		mux.Handle("/", spa)
	}

	// h2c lets HTTP/2 clients (gRPC, and Connect over HTTP/2) talk to us
	// without TLS; browsers use the Connect protocol over HTTP/1.1.
	httpServer := &http.Server{
		Addr:    *bind,
		Handler: h2c.NewHandler(mux, &http2.Server{}),
	}

	if *staticDir != "" {
		log.Printf("listening on %s (serving %s at /)", *bind, *staticDir)
	} else {
		log.Printf("listening on %s", *bind)
	}
	if err := httpServer.ListenAndServe(); err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func envDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
