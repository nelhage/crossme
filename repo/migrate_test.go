package repo

import (
	"path"
	"slices"
	"testing"
	"time"

	"github.com/golang/protobuf/ptypes/timestamp"
	_ "github.com/mattn/go-sqlite3"
	"google.golang.org/protobuf/proto"

	"crossme.app/src/pb"
)

func tableColumns(t *testing.T, r *Repository, table string) []string {
	t.Helper()
	rows, err := r.db.Query("SELECT name FROM pragma_table_info(?)", table)
	if err != nil {
		t.Fatalf("pragma_table_info(%s): %v", table, err)
	}
	defer rows.Close()
	var out []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			t.Fatalf("scan: %v", err)
		}
		out = append(out, name)
	}
	if err := rows.Err(); err != nil {
		t.Fatalf("pragma_table_info(%s): %v", table, err)
	}
	return out
}

// A fresh database is built by running every migration in order, and ends up
// at the current version with a usable schema.
func TestMigrateFromScratch(t *testing.T) {
	t.Parallel()
	repo, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer repo.Close()

	if v := repo.Config.SchemaVersion; v != CurrentSchemaVersion {
		t.Errorf("schema version %d, want %d", v, CurrentSchemaVersion)
	}
	for _, table := range []string{
		"config", "puzzles", "games", "puz_files",
		"users", "identities", "sessions", "game_players",
	} {
		if len(tableColumns(t, repo, table)) == 0 {
			t.Errorf("table %q is missing", table)
		}
	}
	cols := tableColumns(t, repo, "games")
	for _, col := range []string{"completed_at", "owner_id"} {
		if !slices.Contains(cols, col) {
			t.Errorf("games table lacks %s: %v", col, cols)
		}
	}
}

// An old database is migrated forward on open, preserving the data it
// already holds.
func TestMigrateForward(t *testing.T) {
	t.Parallel()
	dbpath := path.Join(t.TempDir(), "crossme.db")

	old, err := open(dbpath, 1)
	if err != nil {
		t.Fatalf("open at v1: %v", err)
	}
	if v := old.Config.SchemaVersion; v != 1 {
		t.Fatalf("schema version %d, want 1", v)
	}
	if cols := tableColumns(t, old, "games"); slices.Contains(cols, "completed_at") {
		t.Fatalf("v1 games table already has completed_at: %v", cols)
	}
	// Insert a game the way a v1 build would have: the current NewGame
	// writes columns (owner_id) that don't exist yet at v1.
	game := &pb.Game{
		Id:       NewId(),
		PuzzleId: "some-puzzle",
		Fill:     &pb.Fill{},
		Created:  &timestamp.Timestamp{Seconds: time.Now().Unix()},
	}
	protobytes, err := proto.Marshal(game)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if _, err := old.db.Exec(
		`INSERT INTO games (proto, id, puzzle_id, created) VALUES (?, ?, ?, ?)`,
		protobytes, game.Id, game.PuzzleId, formatTimestamp(game.Created),
	); err != nil {
		t.Fatalf("insert v1 game: %v", err)
	}
	if err := old.Close(); err != nil {
		t.Fatalf("close: %v", err)
	}

	repo, err := Open(dbpath)
	if err != nil {
		t.Fatalf("reopen: %v", err)
	}
	defer repo.Close()

	if v := repo.Config.SchemaVersion; v != CurrentSchemaVersion {
		t.Errorf("schema version %d, want %d", v, CurrentSchemaVersion)
	}
	if cols := tableColumns(t, repo, "games"); !slices.Contains(cols, "completed_at") {
		t.Errorf("games table lacks completed_at after migration: %v", cols)
	}

	got, err := repo.GameById(game.Id)
	if err != nil {
		t.Fatalf("GameById: %v", err)
	}
	if !proto.Equal(got, game) {
		t.Errorf("game did not survive migration: got %v want %v", got, game)
	}

	// The new columns are writable, and NULL for rows that predate them.
	var owner *string
	if err := repo.db.Get(&owner, "SELECT owner_id FROM games WHERE id = ?", game.Id); err != nil {
		t.Fatalf("select owner_id: %v", err)
	}
	if owner != nil {
		t.Errorf("owner_id = %q, want NULL", *owner)
	}
	var completed *string
	if err := repo.db.Get(&completed, "SELECT completed_at FROM games WHERE id = ?", game.Id); err != nil {
		t.Fatalf("select completed_at: %v", err)
	}
	if completed != nil {
		t.Errorf("completed_at = %q, want NULL", *completed)
	}
	got.CompletedAt = &timestamp.Timestamp{Seconds: time.Now().Unix()}
	if err := repo.UpdateGame(got); err != nil {
		t.Fatalf("UpdateGame: %v", err)
	}
	if err := repo.db.Get(&completed, "SELECT completed_at FROM games WHERE id = ?", game.Id); err != nil {
		t.Fatalf("select completed_at: %v", err)
	}
	if completed == nil {
		t.Errorf("completed_at is still NULL after UpdateGame")
	}
}

// Reopening an up-to-date database re-runs nothing.
func TestMigrateIsIdempotent(t *testing.T) {
	t.Parallel()
	dbpath := path.Join(t.TempDir(), "crossme.db")

	for i := 0; i < 3; i++ {
		repo, err := Open(dbpath)
		if err != nil {
			t.Fatalf("open #%d: %v", i, err)
		}
		if v := repo.Config.SchemaVersion; v != CurrentSchemaVersion {
			t.Errorf("open #%d: schema version %d, want %d", i, v, CurrentSchemaVersion)
		}
		if err := repo.Close(); err != nil {
			t.Fatalf("close #%d: %v", i, err)
		}
	}
}

// A database written by a newer build is refused rather than silently
// misinterpreted.
func TestRefuseFutureSchema(t *testing.T) {
	t.Parallel()
	dbpath := path.Join(t.TempDir(), "crossme.db")

	repo, err := Open(dbpath)
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	if err := writeConfig(repo.db, &pb.Config{SchemaVersion: CurrentSchemaVersion + 1}); err != nil {
		t.Fatalf("writeConfig: %v", err)
	}
	if err := repo.Close(); err != nil {
		t.Fatalf("close: %v", err)
	}

	if _, err := Open(dbpath); err == nil {
		t.Errorf("opening a future-versioned database succeeded")
	}
}

// A failed migration leaves the database untouched, including its recorded
// version.
func TestMigrationIsAtomic(t *testing.T) {
	t.Parallel()
	repo, err := open(":memory:", 0)
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer repo.Close()

	bad := migration{name: "bogus", sql: `CREATE TABLE t (x text) strict; SELECT nonesuch();`}
	if err := repo.applyMigration(&bad, 1); err == nil {
		t.Fatalf("bogus migration succeeded")
	}
	if v := repo.Config.SchemaVersion; v != 0 {
		t.Errorf("schema version %d after failed migration, want 0", v)
	}
	if cols := tableColumns(t, repo, "t"); len(cols) != 0 {
		t.Errorf("failed migration left table t behind: %v", cols)
	}
}

func TestMigrationNames(t *testing.T) {
	t.Parallel()
	seen := make(map[string]bool)
	for i, m := range migrations {
		if m.name == "" {
			t.Errorf("migration %d has no name", i+1)
		}
		if seen[m.name] {
			t.Errorf("migration %d: duplicate name %q", i+1, m.name)
		}
		seen[m.name] = true
	}
}
