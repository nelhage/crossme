package main

import (
	"flag"
	"log"
	"net"

	"crossme.app/src/pb"
	"crossme.app/src/repo"
	"google.golang.org/grpc"
)

func main() {
	var (
		bind = flag.String("bind", "localhost:4000", "bind address")
		db   = flag.String("db", ":memory:", "Database file")
	)
	flag.Parse()

	r, err := repo.Open(*db)
	if err != nil {
		log.Fatal("open db: ", err)
	}

	server := &Server{repo: r}

	lis, err := net.Listen("tcp", *bind)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	grpcServer := grpc.NewServer()
	pb.RegisterCrossMeServer(grpcServer, server)

	if err := grpcServer.Serve(lis); err != nil {
		log.Fatal("grpc.Serve: ", err)
	}
}
