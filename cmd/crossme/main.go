package main

import (
	"flag"
	"log"
	"net"

	"crossme.app/src/pb"
	"crossme.app/src/repo"
	"crossme.app/src/server"
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

	srv := server.New(r)

	lis, err := net.Listen("tcp", *bind)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	grpcServer := grpc.NewServer()
	pb.RegisterCrossMeService(grpcServer, pb.NewCrossMeService(srv))

	if err := grpcServer.Serve(lis); err != nil {
		log.Fatal("grpc.Serve: ", err)
	}
}
