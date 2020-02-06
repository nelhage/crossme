package server

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"testing"
	"time"

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
		&pb.UploadPuzzleArgs{
			Filename: path,
			Data:     bytes,
		})
	if err != nil {
		t.Fatalf("Upload(%q): %v", path, err)
	}
	return ts, resp.Puzzle
}

func TestSubscribeSimple(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	ts, puz := makeServerWithPuzzle(t, "nyt_weekday_with_notes")
	cl1 := ts.Dial()
	cl2 := ts.Dial()

	g, err := cl1.NewGame(ctx, &pb.NewGameArgs{PuzzleId: puz.Metadata.Id})
	must(t, "NewGame", err)

	sub, err := cl1.Subscribe(ctx, &pb.SubscribeArgs{
		GameId: g.Game.Id,
		NodeId: "node1",
	})
	must(t, "Subscribe", err)

	evt, err := sub.Recv()
	must(t, "First Recv", err)

	if len(evt.Fill.Cells) != 0 {
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

	_, err = cl2.UpdateFill(ctx, &pb.UpdateFillArgs{
		GameId: g.Game.Id,
		Fill:   fill,
	})
	must(t, "UpdateFill", err)

	evt, err = sub.Recv()
	must(t, "Second Recv", err)
	assertJSON(t, "reflected fill", fill, evt.Fill)
}
