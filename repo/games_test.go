package repo

import (
	"os"
	"path"
	"testing"
	"time"

	_ "github.com/mattn/go-sqlite3"

	"crossme.app/src/pb"
	"crossme.app/src/puz"
)

// insertTestPuzzle loads a .puz fixture into the repo and returns its id.
func insertTestPuzzle(t *testing.T, r *Repository, name string) string {
	t.Helper()
	data, err := os.ReadFile(path.Join(TestdataPath, name))
	if err != nil {
		t.Fatalf("Reading puzzle: %v", err)
	}
	puzzle, err := puz.FromBytes(data)
	if err != nil {
		t.Fatalf("Loading puzzle: %v", err)
	}
	id, err := r.InsertPuzzle(Puz2Proto(puzzle), data)
	if err != nil {
		t.Fatalf("insert %q: %v", name, err)
	}
	return id
}

func gamesForUser(t *testing.T, r *Repository, user string) []*pb.MyGame {
	t.Helper()
	games, err := r.GamesForUser(user)
	if err != nil {
		t.Fatalf("GamesForUser(%q): %v", user, err)
	}
	return games
}

func TestPlayHistory(t *testing.T) {
	t.Parallel()
	r, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer r.Close()

	puzzleId := insertTestPuzzle(t, r, "nyt_sun_rebus.puz")
	game1, err := r.NewGame(puzzleId, "")
	if err != nil {
		t.Fatalf("NewGame: %v", err)
	}
	game2, err := r.NewGame(puzzleId, "")
	if err != nil {
		t.Fatalf("NewGame: %v", err)
	}

	const user = "user-1"
	if games := gamesForUser(t, r, user); len(games) != 0 {
		t.Fatalf("history for a fresh user: %v", games)
	}

	// game1 was played a while ago, game2 just now. Explicit times,
	// since RFC3339 only has second granularity.
	past := time.Date(2001, 1, 1, 0, 0, 0, 0, time.UTC)
	if err := r.RecordPlayAt(game1.Id, user, past); err != nil {
		t.Fatalf("RecordPlayAt: %v", err)
	}
	if err := r.RecordPlay(game2.Id, user); err != nil {
		t.Fatalf("RecordPlay: %v", err)
	}

	games := gamesForUser(t, r, user)
	if len(games) != 2 {
		t.Fatalf("expected 2 games, got %d", len(games))
	}
	// Most recently played first.
	if games[0].GameId != game2.Id || games[1].GameId != game1.Id {
		t.Errorf("wrong order: got [%s, %s], want [%s, %s]",
			games[0].GameId, games[1].GameId, game2.Id, game1.Id)
	}
	for _, g := range games {
		if g.PuzzleId != puzzleId {
			t.Errorf("game %q: puzzle %q, want %q", g.GameId, g.PuzzleId, puzzleId)
		}
		if g.Title == "" {
			t.Errorf("game %q: missing title", g.GameId)
		}
		if g.FirstPlayed == nil || g.LastPlayed == nil {
			t.Errorf("game %q: missing played times: %v", g.GameId, g)
		}
		if g.CompletedAt != nil {
			t.Errorf("game %q: completed_at set on an in-progress game", g.GameId)
		}
	}

	// Replaying a game refreshes last_played but keeps first_played.
	if err := r.RecordPlay(game1.Id, user); err != nil {
		t.Fatalf("RecordPlay: %v", err)
	}
	games = gamesForUser(t, r, user)
	if len(games) != 2 {
		t.Fatalf("replay duplicated the entry: %d games", len(games))
	}
	var replayed *pb.MyGame
	for _, g := range games {
		if g.GameId == game1.Id {
			replayed = g
		}
	}
	if replayed == nil {
		t.Fatalf("game1 missing after replay")
	}
	if got := replayed.FirstPlayed.AsTime(); !got.Equal(past) {
		t.Errorf("first_played changed on replay: %v, want %v", got, past)
	}
	if !replayed.LastPlayed.AsTime().After(past) {
		t.Errorf("last_played not refreshed: %v", replayed.LastPlayed.AsTime())
	}

	// Merging an even older play widens first_played but not last_played
	// (this is how pre-sign-in plays sync in from the browser).
	older := past.Add(-24 * time.Hour)
	if err := r.RecordPlayAt(game1.Id, user, older); err != nil {
		t.Fatalf("RecordPlayAt: %v", err)
	}
	// A play inside the current window changes nothing.
	if err := r.RecordPlayAt(game1.Id, user, past); err != nil {
		t.Fatalf("RecordPlayAt: %v", err)
	}
	games = gamesForUser(t, r, user)
	for _, g := range games {
		if g.GameId != game1.Id {
			continue
		}
		if got := g.FirstPlayed.AsTime(); !got.Equal(older) {
			t.Errorf("first_played not widened: %v, want %v", got, older)
		}
		if !g.LastPlayed.AsTime().After(past) {
			t.Errorf("last_played shrank: %v", g.LastPlayed.AsTime())
		}
	}

	// Plays of games that don't exist are ignored, not recorded.
	if err := r.RecordPlay("no-such-game", user); err != nil {
		t.Fatalf("RecordPlay(no-such-game): %v", err)
	}
	if games := gamesForUser(t, r, user); len(games) != 2 {
		t.Errorf("nonexistent game entered the history: %v", games)
	}

	// Other users' histories are unaffected.
	if games := gamesForUser(t, r, "user-2"); len(games) != 0 {
		t.Fatalf("history leaked across users: %v", games)
	}
}
