package repo

import (
	"os"
	"path"
	"testing"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"google.golang.org/protobuf/types/known/timestamppb"

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

// puzzleGame returns the game attached to `puzzleId` in the index as seen
// by `user`, or nil if there is none.
func puzzleGame(t *testing.T, r *Repository, user, puzzleId string) *pb.PuzzleIndex_Game {
	t.Helper()
	index, err := r.PuzzleIndex(user)
	if err != nil {
		t.Fatalf("PuzzleIndex(%q): %v", user, err)
	}
	for _, puz := range index {
		if puz.Id == puzzleId {
			return puz.Game
		}
	}
	t.Fatalf("puzzle %q missing from the index", puzzleId)
	return nil
}

func TestPuzzleIndexGames(t *testing.T) {
	t.Parallel()
	r, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer r.Close()

	puzzleId := insertTestPuzzle(t, r, "nyt_sun_rebus.puz")
	otherId := insertTestPuzzle(t, r, "nyt_weekday_with_notes.puz")

	// Nothing played yet: no game on either puzzle, for anyone.
	const user = "user-1"
	for _, u := range []string{"", user} {
		for _, p := range []string{puzzleId, otherId} {
			if g := puzzleGame(t, r, u, p); g != nil {
				t.Errorf("user %q, puzzle %q: unexpected game %v", u, p, g)
			}
		}
	}

	newGame := func() *pb.Game {
		game, err := r.NewGame(puzzleId, "")
		if err != nil {
			t.Fatalf("NewGame: %v", err)
		}
		return game
	}
	playAt := func(game *pb.Game, at time.Time) {
		if err := r.RecordPlayAt(game.Id, user, at); err != nil {
			t.Fatalf("RecordPlayAt: %v", err)
		}
	}
	t0 := time.Date(2001, 1, 1, 0, 0, 0, 0, time.UTC)

	// One in-progress game: that's the one.
	old := newGame()
	playAt(old, t0)
	got := puzzleGame(t, r, user, puzzleId)
	if got == nil || got.Id != old.Id {
		t.Fatalf("game = %v, want %s", got, old.Id)
	}
	if !got.LastPlayed.AsTime().Equal(t0) {
		t.Errorf("last_played = %v, want %v", got.LastPlayed.AsTime(), t0)
	}
	if got.CompletedAt != nil {
		t.Errorf("in-progress game marked complete: %v", got)
	}
	// ...but only for the player: other users and anonymous callers
	// see nothing, and the other puzzle is untouched.
	if g := puzzleGame(t, r, "", puzzleId); g != nil {
		t.Errorf("anonymous caller sees a game: %v", g)
	}
	if g := puzzleGame(t, r, "user-2", puzzleId); g != nil {
		t.Errorf("another user sees the game: %v", g)
	}
	if g := puzzleGame(t, r, user, otherId); g != nil {
		t.Errorf("game attached to the wrong puzzle: %v", g)
	}

	// Among in-progress games, the most recently played wins.
	recent := newGame()
	playAt(recent, t0.Add(time.Hour))
	if got := puzzleGame(t, r, user, puzzleId); got.Id != recent.Id {
		t.Errorf("game = %s, want the more recent %s", got.Id, recent.Id)
	}

	// A solved game beats any in-progress one, however stale.
	solved := newGame()
	playAt(solved, t0.Add(-time.Hour))
	solved.CompletedAt = timestamppb.New(t0)
	if err := r.UpdateGame(solved); err != nil {
		t.Fatalf("UpdateGame: %v", err)
	}
	got = puzzleGame(t, r, user, puzzleId)
	if got.Id != solved.Id {
		t.Errorf("game = %s, want the solved %s", got.Id, solved.Id)
	}
	if got.CompletedAt == nil || !got.CompletedAt.AsTime().Equal(t0) {
		t.Errorf("completed_at = %v, want %v", got.CompletedAt, t0)
	}

	// A game the user never opened doesn't count, even if solved.
	unplayed := newGame()
	unplayed.CompletedAt = timestamppb.New(t0.Add(time.Hour))
	if err := r.UpdateGame(unplayed); err != nil {
		t.Fatalf("UpdateGame: %v", err)
	}
	if got := puzzleGame(t, r, user, puzzleId); got.Id != solved.Id {
		t.Errorf("game = %s, want the played %s", got.Id, solved.Id)
	}
}
