package main

import (
	"flag"
	"log"
	"net/http"

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
