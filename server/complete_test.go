package server

import (
	"context"
	"testing"
	"time"

	"connectrpc.com/connect"
	"crossme.app/src/pb"
)

// solvedFill builds a fill containing the puzzle's full solution.
func solvedFill(puz *pb.Puzzle, clock int64) *pb.Fill {
	fill := &pb.Fill{
		Clock: clock,
		Nodes: []string{"solver"},
	}
	for i, sq := range puz.Squares {
		if sq.Black {
			continue
		}
		fill.Cells = append(fill.Cells, &pb.Fill_Cell{
			Index: uint32(i),
			Clock: clock,
			Owner: 0,
			Fill:  sq.Fill,
		})
	}
	return fill
}

func firstWhiteSquare(t *testing.T, puz *pb.Puzzle) uint32 {
	for i, sq := range puz.Squares {
		if !sq.Black {
			return uint32(i)
		}
	}
	t.Fatalf("puzzle has no white squares")
	return 0
}

func TestCompletion(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	ts, puz := makeServerWithPuzzle(t, "nyt_weekday_with_notes")
	cl := ts.Dial()

	g, err := cl.NewGame(ctx, connect.NewRequest(&pb.NewGameArgs{PuzzleId: puz.Metadata.Id}))
	must(t, "NewGame", err)
	gameId := g.Msg.Game.Id

	sub, err := cl.Subscribe(ctx, connect.NewRequest(&pb.SubscribeArgs{
		GameId: gameId,
		NodeId: "node1",
	}))
	must(t, "Subscribe", err)
	defer sub.Close()

	if !sub.Receive() {
		t.Fatalf("initial Recv: %v", sub.Err())
	}

	// A client-side claim of completeness is stripped: the fill below
	// is wrong, so the game must not freeze, and subscribers must not
	// see the flag.
	white := firstWhiteSquare(t, puz)
	wrong := "X"
	if puz.Squares[white].Fill == "X" {
		wrong = "Z"
	}
	lie := &pb.Fill{
		Complete: true,
		Clock:    1,
		Nodes:    []string{"liar"},
		Cells: []*pb.Fill_Cell{
			{Index: white, Clock: 1, Owner: 0, Fill: wrong},
		},
	}
	_, err = cl.UpdateFill(ctx, connect.NewRequest(&pb.UpdateFillArgs{
		GameId: gameId,
		Fill:   lie,
	}))
	must(t, "UpdateFill(lie)", err)

	if !sub.Receive() {
		t.Fatalf("Recv after lie: %v", sub.Err())
	}
	if sub.Msg().Fill.Complete {
		t.Fatalf("client-sent complete flag survived the server")
	}

	got, err := cl.GetGameById(ctx, connect.NewRequest(&pb.GetGameByIdArgs{Id: gameId}))
	must(t, "GetGameById", err)
	if got.Msg.Game.Fill.Complete || got.Msg.Game.CompletedAt != nil {
		t.Fatalf("game marked complete from an unsolved fill")
	}

	// Actually solving the puzzle completes the game: subscribers
	// receive the full canonical fill with complete set, and
	// completed_at is recorded.
	solved := solvedFill(puz, 5)
	_, err = cl.UpdateFill(ctx, connect.NewRequest(&pb.UpdateFillArgs{
		GameId: gameId,
		Fill:   solved,
	}))
	must(t, "UpdateFill(solved)", err)

	if !sub.Receive() {
		t.Fatalf("Recv after solve: %v", sub.Err())
	}
	final := sub.Msg().Fill
	if !final.Complete {
		t.Fatalf("solved fill not marked complete")
	}
	if len(final.Cells) != len(solved.Cells) {
		t.Fatalf("completion broadcast is not the full fill: %d cells != %d",
			len(final.Cells), len(solved.Cells))
	}

	got, err = cl.GetGameById(ctx, connect.NewRequest(&pb.GetGameByIdArgs{Id: gameId}))
	must(t, "GetGameById", err)
	if !got.Msg.Game.Fill.Complete {
		t.Fatalf("persisted game not marked complete")
	}
	if got.Msg.Game.CompletedAt == nil {
		t.Fatalf("persisted game has no completed_at")
	}

	// The game is now frozen: further updates are dropped.
	late := &pb.Fill{
		Clock: 10,
		Nodes: []string{"late"},
		Cells: []*pb.Fill_Cell{
			{Index: white, Clock: 10, Owner: 0, Fill: wrong},
		},
	}
	_, err = cl.UpdateFill(ctx, connect.NewRequest(&pb.UpdateFillArgs{
		GameId: gameId,
		Fill:   late,
	}))
	must(t, "UpdateFill(late)", err)

	got, err = cl.GetGameById(ctx, connect.NewRequest(&pb.GetGameByIdArgs{Id: gameId}))
	must(t, "GetGameById", err)
	assertJSON(t, "frozen fill", final, got.Msg.Game.Fill)
}
