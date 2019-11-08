package main

import (
	"crypto/sha256"
	"encoding/hex"
	"flag"
	"io/ioutil"
	"log"
	"net"
	"os"

	"crossme.app/src/pb"
	"crossme.app/src/puz"
	"google.golang.org/grpc"
)

func main() {
	var (
		bind = flag.String("bind", "localhost:4000", "bind address")
	)
	flag.Parse()
	args := flag.Args()
	if len(args) != 1 {
		log.Fatalf("Usage: %s puzzle.puz", os.Args[0])
	}

	data, err := ioutil.ReadFile(args[0])
	if err != nil {
		log.Fatalf("Reading puzzle: %v", err)
	}

	puzzle, err := puz.FromBytes(data)
	if err != nil {
		log.Fatalf("Loading puzzle: %v", err)
	}

	hash := sha256.Sum256(data)

	server := &Server{puz: puzzle, sha256: hex.EncodeToString(hash[:])}

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
