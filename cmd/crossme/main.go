package main

import (
	"context"
	"flag"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"crossme.app/src/auth"
	"crossme.app/src/pb/pbconnect"
	"crossme.app/src/repo"
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
	)
	flag.Parse()

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
	authHandler := auth.NewHandler(r, providers...)

	mux := http.NewServeMux()
	if len(providers) > 0 {
		authHandler.Register(mux)
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

	// h2c lets HTTP/2 clients (gRPC, and Connect over HTTP/2) talk to us
	// without TLS; browsers use the Connect protocol over HTTP/1.1.
	httpServer := &http.Server{
		Addr:    *bind,
		Handler: h2c.NewHandler(mux, &http2.Server{}),
	}

	log.Printf("listening on %s", *bind)
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
