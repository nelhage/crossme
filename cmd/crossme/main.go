package main

import (
	"context"
	"flag"
	"io"
	"log"
	"net/http"
	"time"

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
	)
	flag.Parse()

	r, err := repo.Open(*db)
	if err != nil {
		log.Fatal("open db: ", err)
	}

	srv := server.New(r)

	mux := http.NewServeMux()

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
	// server and through nginx in production.
	mux.Handle("/api"+path, http.StripPrefix("/api", handler))

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
