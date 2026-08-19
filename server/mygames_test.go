package server

import (
	"context"
	"testing"

	"connectrpc.com/connect"
	"crossme.app/src/pb"
)

func TestMyGames(t *testing.T) {
	ctx := context.Background()
	ts, puz := makeServerWithPuzzle(t, "nyt_weekday_with_notes")
	defer ts.Stop()

	// Anonymous callers get an empty history, not an error.
	anon := ts.Dial()
	resp, err := anon.GetMyGames(ctx, connect.NewRequest(&pb.GetMyGamesArgs{}))
	must(t, "anonymous GetMyGames", err)
	if len(resp.Msg.Games) != 0 {
		t.Fatalf("anonymous history: %v", resp.Msg.Games)
	}

	ada, _ := ts.DialAs("ada")
	g, err := ada.NewGame(ctx, connect.NewRequest(&pb.NewGameArgs{PuzzleId: puz.Metadata.Id}))
	must(t, "NewGame", err)
	gameId := g.Msg.Game.Id

	// Creating a game does not by itself record a play; opening it does.
	_, err = ada.GetGameById(ctx, connect.NewRequest(&pb.GetGameByIdArgs{Id: gameId}))
	must(t, "GetGameById", err)

	resp, err = ada.GetMyGames(ctx, connect.NewRequest(&pb.GetMyGamesArgs{}))
	must(t, "GetMyGames", err)
	if len(resp.Msg.Games) != 1 {
		t.Fatalf("expected 1 game, got %v", resp.Msg.Games)
	}
	got := resp.Msg.Games[0]
	if got.GameId != gameId {
		t.Errorf("game id %q, want %q", got.GameId, gameId)
	}
	if got.PuzzleId != puz.Metadata.Id {
		t.Errorf("puzzle id %q, want %q", got.PuzzleId, puz.Metadata.Id)
	}
	if got.Title != puz.Title || got.Author != puz.Author {
		t.Errorf("title/author %q/%q, want %q/%q", got.Title, got.Author, puz.Title, puz.Author)
	}
	if got.LastPlayed == nil || got.FirstPlayed == nil {
		t.Errorf("missing played times: %v", got)
	}
	if got.CompletedAt != nil {
		t.Errorf("in-progress game marked complete: %v", got)
	}

	// A second player who opens the same game gets it in their history
	// too; history is per-user, not per-owner.
	bob, _ := ts.DialAs("bob")
	_, err = bob.GetGameById(ctx, connect.NewRequest(&pb.GetGameByIdArgs{Id: gameId}))
	must(t, "GetGameById", err)
	resp, err = bob.GetMyGames(ctx, connect.NewRequest(&pb.GetMyGamesArgs{}))
	must(t, "GetMyGames", err)
	if len(resp.Msg.Games) != 1 || resp.Msg.Games[0].GameId != gameId {
		t.Fatalf("bob's history: %v", resp.Msg.Games)
	}

	// Anonymous loads are not recorded anywhere.
	_, err = anon.GetGameById(ctx, connect.NewRequest(&pb.GetGameByIdArgs{Id: gameId}))
	must(t, "anonymous GetGameById", err)

	// Completing the game shows up as completed_at in the history.
	_, err = ada.UpdateFill(ctx, connect.NewRequest(&pb.UpdateFillArgs{
		GameId: gameId,
		NodeId: "node1",
		Fill:   solvedFill(puz, 1),
	}))
	must(t, "UpdateFill", err)
	resp, err = ada.GetMyGames(ctx, connect.NewRequest(&pb.GetMyGamesArgs{}))
	must(t, "GetMyGames", err)
	if len(resp.Msg.Games) != 1 || resp.Msg.Games[0].CompletedAt == nil {
		t.Errorf("completed game not marked in history: %v", resp.Msg.Games)
	}
}
