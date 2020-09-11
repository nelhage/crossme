package server

import (
	"context"
	"io/ioutil"
	"log"
	"net"
	"testing"
	"time"

	mysqltest "github.com/lestrrat-go/test-mysqld"

	"crossme.app/src/pb"
	"crossme.app/src/repo"

	"google.golang.org/grpc"
	"google.golang.org/grpc/test/bufconn"
)

const bufSize = 1024 * 1024

type TestServer struct {
	t        *testing.T
	listener *bufconn.Listener
	mysqld   *mysqltest.TestMysqld
	repo     *repo.Repository
	grpc     *grpc.Server
}

func (ts *TestServer) Stop() {
	ts.grpc.Stop()
	ts.repo.Close()
	ts.mysqld.Stop()
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
	srv.mysqld, err = mysqltest.NewMysqld(nil)
	if err != nil {
		t.Fatalf("Failed to start mysqld: %s", err)
	}

	srv.repo, err = repo.Open(srv.mysqld.DSN())
	if err != nil {
		t.Fatalf("open repo: %v", err)
	}
	pb.RegisterCrossMeService(srv.grpc, pb.NewCrossMeService(&Server{repo: srv.repo}))
	go func() {
		if err := srv.grpc.Serve(srv.listener); err != nil {
			log.Fatal("grpc.Serve: ", err)
		}
	}()

	return &srv
}

func TestTestServer(t *testing.T) {
	ctx := context.Background()

	srv := makeServer(t)
	defer srv.Stop()
	client := srv.Dial()

	index, err := client.GetPuzzleIndex(ctx, &pb.GetPuzzleIndexArgs{})
	if err != nil {
		t.Fatalf("GetIndex: %v", err)
	}
	if len(index.Puzzles) != 0 {
		t.Fatalf("Server has puzzles: %d", len(index.Puzzles))
	}
}

func TestUploadPuzzle(t *testing.T) {
	ctx := context.Background()

	srv := makeServer(t)
	defer srv.Stop()

	client := srv.Dial()

	if _, err := client.UploadPuzzle(ctx, &pb.UploadPuzzleArgs{Data: []byte{}}); err == nil {
		t.Fatalf("UploadPuzzle('') succeeded!")
	}

	bytes, err := ioutil.ReadFile("../puz/testdata/nyt_weekday_with_notes.puz")
	if err != nil {
		panic("ReadFile")
	}

	resp, err := client.UploadPuzzle(ctx, &pb.UploadPuzzleArgs{
		Filename: "nyt_weekday_with_notes.puz",
		Data:     bytes})
	if err != nil {
		t.Fatalf("Upload failed: %v", err)
	}
	if resp.Puzzle.Metadata == nil {
		t.Fatalf("expected uploaded puzzle to have metadata!")
	}

}
