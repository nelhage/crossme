package repo

import (
	"os"
	"path"
	"testing"

	_ "github.com/mattn/go-sqlite3"

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
	games, err := r.GamesForUser(user)
	if err != nil {
		t.Fatalf("GamesForUser: %v", err)
	}
	if len(games) != 0 {
		t.Fatalf("history for a fresh user: %v", games)
	}

	for _, id := range []string{game1.Id, game2.Id} {
		if err := r.RecordPlay(id, user); err != nil {
			t.Fatalf("RecordPlay(%q): %v", id, err)
		}
	}

	// Backdate game1 so the two plays have distinct times; RFC3339
	// timestamps only have second granularity.
	if _, err := r.db.Exec(
		`UPDATE game_players SET first_played = '2001-01-01T00:00:00Z', last_played = '2001-01-01T00:00:00Z'
		 WHERE game_id = ?`, game1.Id); err != nil {
		t.Fatalf("backdating: %v", err)
	}

	games, err = r.GamesForUser(user)
	if err != nil {
		t.Fatalf("GamesForUser: %v", err)
	}
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
	games, err = r.GamesForUser(user)
	if err != nil {
		t.Fatalf("GamesForUser: %v", err)
	}
	if len(games) != 2 {
		t.Fatalf("replay duplicated the entry: %d games", len(games))
	}
	var replayed *struct{ first, last int64 }
	for _, g := range games {
		if g.GameId == game1.Id {
			replayed = &struct{ first, last int64 }{g.FirstPlayed.Seconds, g.LastPlayed.Seconds}
		}
	}
	if replayed == nil {
		t.Fatalf("game1 missing after replay")
	}
	if got, err := parseTime("2001-01-01T00:00:00Z"); err != nil || replayed.first != got.Unix() {
		t.Errorf("first_played changed on replay: %d", replayed.first)
	}
	if replayed.last <= replayed.first {
		t.Errorf("last_played not refreshed: first=%d last=%d", replayed.first, replayed.last)
	}

	// Other users' histories are unaffected.
	games, err = r.GamesForUser("user-2")
	if err != nil {
		t.Fatalf("GamesForUser: %v", err)
	}
	if len(games) != 0 {
		t.Fatalf("history leaked across users: %v", games)
	}
}
