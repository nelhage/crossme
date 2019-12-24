package main

import (
	"context"
	"net"
	"testing"
	"time"

	"crossme.app/src/pb"
	"crossme.app/src/repo"

	"google.golang.org/grpc"
	"google.golang.org/grpc/test/bufconn"
)

const bufSize = 1024 * 1024

type TestServer struct {
	t        *testing.T
	listener *bufconn.Listener
	repo     *repo.Repository
	grpc     *grpc.Server
}

func (ts *TestServer) Stop() {
	ts.grpc.Stop()
	ts.repo.Close()
}

func (ts *TestServer) dialer(string, time.Duration) (net.Conn, error) {
	return ts.listener.Dial()
}

func (ts *TestServer) Dial() pb.CrossMeClient {
	ctx := context.Background()
	conn, err := grpc.DialContext(ctx, "bufnet", grpc.WithDialer(ts.dialer), grpc.WithInsecure())
	if err != nil {
		ts.t.Fatalf("Failed to dial bufnet: %v", err)
	}
	return pb.NewCrossMeClient(conn)
}

func makeServer(t *testing.T) *TestServer {
	var srv TestServer
	var err error
	srv.t = t
	srv.listener = bufconn.Listen(bufSize)
	srv.grpc = grpc.NewServer()
	srv.repo, err = repo.Open(":memory:")
	if err != nil {
		t.Fatalf("open repo: %v", err)
	}
	pb.RegisterCrossMeServer(srv.grpc, &Server{repo: srv.repo})
	go func() {
		if err := srv.grpc.Serve(srv.listener); err != nil {
			t.Fatal("grpc.Serve: ", err)
		}
	}()

	return &srv
}

func TestTestServer(t *testing.T) {
	ctx := context.Background()

	srv := makeServer(t)
	client := srv.Dial()

	index, err := client.GetPuzzleIndex(ctx, &pb.GetPuzzleIndexArgs{})
	if err != nil {
		t.Fatalf("GetIndex: %v", err)
	}
	if len(index.Puzzles) != 0 {
		t.Fatalf("Server has puzzles: %d", len(index.Puzzles))
	}
	defer srv.Stop()
}
