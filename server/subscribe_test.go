package server

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"testing"
	"time"

	"connectrpc.com/connect"
	"crossme.app/src/pb"
	"github.com/kylelemons/godebug/diff"
)

func must(t *testing.T, what string, err error) {
	if err != nil {
		t.Fatalf("%s: %v", what, err)
	}
}

func assertJSON(t *testing.T, name string, expect interface{}, got interface{}) {
	gotbytes, err := json.MarshalIndent(got, "", "  ")
	must(t, "Marshal", err)

	wantbytes, err := json.MarshalIndent(expect, "", "  ")
	must(t, "Marshal", err)

	gotstr := string(gotbytes)
	wantstr := string(wantbytes)
	if gotstr != wantstr {
		d := diff.Diff(wantstr, gotstr)
		t.Fatalf("merge error (%s): diff (-want, +got):\n%s", name, d)
	}
}

func makeServerWithPuzzle(t *testing.T, name string) (*TestServer, *pb.Puzzle) {
	ts := makeServer(t)
	path := fmt.Sprintf("../puz/testdata/%s.puz", name)
	bytes, err := ioutil.ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile(%q): %v", path, err)
	}
	resp, err := ts.Dial().UploadPuzzle(context.Background(),
		connect.NewRequest(&pb.UploadPuzzleArgs{
			Filename: path,
			Data:     bytes,
		}))
	if err != nil {
		t.Fatalf("Upload(%q): %v", path, err)
	}
	return ts, resp.Msg.Puzzle
}

func TestSubscribeSimple(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	ts, puz := makeServerWithPuzzle(t, "nyt_weekday_with_notes")
	cl1 := ts.Dial()
	cl2 := ts.Dial()

	g, err := cl1.NewGame(ctx, connect.NewRequest(&pb.NewGameArgs{PuzzleId: puz.Metadata.Id}))
	must(t, "NewGame", err)

	sub, err := cl1.Subscribe(ctx, connect.NewRequest(&pb.SubscribeArgs{
		GameId: g.Msg.Game.Id,
		NodeId: "node1",
	}))
	must(t, "Subscribe", err)
	defer sub.Close()

	if !sub.Receive() {
		t.Fatalf("First Recv: %v", sub.Err())
	}

	if len(sub.Msg().Fill.Cells) != 0 {
		t.Fatalf("expected empty fill")
	}

	fill := &pb.Fill{
		Clock: 2,
		Nodes: []string{"node2"},
		Cells: []*pb.Fill_Cell{
			&pb.Fill_Cell{
				Index: 0,
				Clock: 2,
				Owner: 0,
				Fill:  "X",
			},
		},
	}

	_, err = cl2.UpdateFill(ctx, connect.NewRequest(&pb.UpdateFillArgs{
		GameId: g.Msg.Game.Id,
		Fill:   fill,
	}))
	must(t, "UpdateFill", err)

	if !sub.Receive() {
		t.Fatalf("Second Recv: %v", sub.Err())
	}
	assertJSON(t, "reflected fill", fill, sub.Msg().Fill)
}
