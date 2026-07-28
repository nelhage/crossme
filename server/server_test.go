package server

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"connectrpc.com/connect"
	"crossme.app/src/pb"
	"crossme.app/src/pb/pbconnect"
	"crossme.app/src/repo"
)

type TestServer struct {
	t    *testing.T
	http *httptest.Server
	repo *repo.Repository
}

func (ts *TestServer) Stop() {
	ts.http.Close()
	ts.repo.Close()
}

func (ts *TestServer) Dial() pbconnect.CrossMeClient {
	return pbconnect.NewCrossMeClient(ts.http.Client(), ts.http.URL)
}

func makeServer(t *testing.T) *TestServer {
	var srv TestServer
	var err error
	srv.t = t
	srv.repo, err = repo.Open(":memory:")
	if err != nil {
		t.Fatalf("open repo: %v", err)
	}

	mux := http.NewServeMux()
	mux.Handle(pbconnect.NewCrossMeHandler(&Server{repo: srv.repo}))
	srv.http = httptest.NewServer(mux)

	return &srv
}

func TestTestServer(t *testing.T) {
	ctx := context.Background()

	srv := makeServer(t)
	defer srv.Stop()
	client := srv.Dial()

	index, err := client.GetPuzzleIndex(ctx, connect.NewRequest(&pb.GetPuzzleIndexArgs{}))
	if err != nil {
		t.Fatalf("GetIndex: %v", err)
	}
	if len(index.Msg.Puzzles) != 0 {
		t.Fatalf("Server has puzzles: %d", len(index.Msg.Puzzles))
	}
}

func TestUploadPuzzle(t *testing.T) {
	ctx := context.Background()

	srv := makeServer(t)
	defer srv.Stop()

	client := srv.Dial()

	if _, err := client.UploadPuzzle(ctx, connect.NewRequest(&pb.UploadPuzzleArgs{Data: []byte{}})); err == nil {
		t.Fatalf("UploadPuzzle('') succeeded!")
	}

	bytes, err := os.ReadFile("../puz/testdata/nyt_weekday_with_notes.puz")
	if err != nil {
		panic("ReadFile")
	}

	resp, err := client.UploadPuzzle(ctx, connect.NewRequest(&pb.UploadPuzzleArgs{
		Filename: "nyt_weekday_with_notes.puz",
		Data:     bytes}))
	if err != nil {
		t.Fatalf("Upload failed: %v", err)
	}
	if resp.Msg.Puzzle.Metadata == nil {
		t.Fatalf("expected uploaded puzzle to have metadata!")
	}

}
