package repo

import (
	"database/sql"
	"fmt"

	"github.com/jmoiron/sqlx"
	"google.golang.org/protobuf/proto"

	"crossme.app/src/pb"
)

// The config table holds the schema version, so it has to exist before we
// can decide which migrations to run. It is created (idempotently) on every
// open, outside of the migration sequence.
const sql_create_config = `
CREATE TABLE IF NOT EXISTS config (
  id int primary key not null,
  proto blob not null
) strict;
`

const sql_write_config = `REPLACE INTO config (id, proto) VALUES(0, ?)`

// A migration upgrades the database schema by a single version. Applying
// migrations[i] moves the database from schema version i to version i+1;
// each one runs exactly once, in its own transaction, together with the
// config update that records the new version.
type migration struct {
	name string
	sql  string
	// Optional Go step, run in the same transaction after `sql`, for
	// work that plain SQL can't express -- typically backfilling a new
	// column from the protos already stored in the table.
	fn func(tx *sqlx.Tx) error
}

// migrations is append-only: once a migration has shipped, edit it only to
// fix something that has never run anywhere. Adding a new one is the way to
// change the schema.
var migrations = []migration{
	{
		name: "initial-schema",
		sql: `
CREATE TABLE puzzles (
  proto blob not null,
  title text not null,
  meta__sha256 text null unique,
  meta__id text unique not null primary key,
  meta__date text not null,
  meta__created text not null
) strict;

CREATE INDEX puzzles__date ON puzzles (meta__date);

CREATE TABLE games (
  proto blob not null,
  id text not null unique primary key,
  puzzle_id text not null,
  created text not null
) strict;

CREATE TABLE puz_files (
  sha256 text unique primary key,
  file blob
) strict;
`,
	},
	{
		name: "games-completed-at",
		sql: `
ALTER TABLE games ADD COLUMN completed_at text null;
`,
	},
	{
		// User accounts. A user is our own record; each external login
		// (Google today, possibly others later) is an identity row
		// pointing at a user. Sessions are durable so a server restart
		// doesn't log everyone out, and store only a hash of the token
		// so a copy of the database doesn't yield live sessions.
		name: "user-accounts",
		sql: `
CREATE TABLE users (
  proto blob not null,
  id text unique not null primary key,
  created text not null
) strict;

CREATE TABLE identities (
  proto blob not null,
  provider text not null,
  subject text not null,
  user_id text not null references users(id),
  primary key (provider, subject)
) strict;

CREATE INDEX identities__user_id ON identities (user_id);

CREATE TABLE sessions (
  token_hash text unique not null primary key,
  user_id text not null references users(id),
  created text not null,
  expires text not null
) strict;

CREATE INDEX sessions__user_id ON sessions (user_id);

ALTER TABLE games ADD COLUMN owner_id text null;
`,
	},
	{
		// Per-user play history: one row per (user, game) a signed-in
		// user has opened, powering the "My games" view. Anonymous
		// play is never recorded here.
		name: "game-players",
		sql: `
CREATE TABLE game_players (
  user_id text not null references users(id),
  game_id text not null references games(id),
  first_played text not null,
  last_played text not null,
  primary key (user_id, game_id)
) strict;
`,
	},
	{
		// The author, replicated out of the proto so the puzzle index
		// can list and search by it without decoding every puzzle.
		name: "puzzles-author",
		sql: `
ALTER TABLE puzzles ADD COLUMN author text not null default '';
`,
		fn: backfillPuzzleAuthors,
	},
}

// backfillPuzzleAuthors fills the puzzles.author column from each row's
// proto, for puzzles inserted before the column existed.
func backfillPuzzleAuthors(tx *sqlx.Tx) error {
	rows, err := tx.Query("SELECT meta__id, proto FROM puzzles")
	if err != nil {
		return err
	}
	type row struct {
		id     string
		author string
	}
	var updates []row
	for rows.Next() {
		var id string
		var data []byte
		if err := rows.Scan(&id, &data); err != nil {
			rows.Close()
			return err
		}
		var puz pb.Puzzle
		if err := proto.Unmarshal(data, &puz); err != nil {
			rows.Close()
			return fmt.Errorf("decoding puzzle %s: %w", id, err)
		}
		updates = append(updates, row{id, puz.Author})
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return err
	}
	for _, u := range updates {
		if _, err := tx.Exec("UPDATE puzzles SET author = ? WHERE meta__id = ?", u.author, u.id); err != nil {
			return err
		}
	}
	return nil
}

// CurrentSchemaVersion is the schema version this build expects. A database
// below it is migrated forward on open; a database above it is refused.
var CurrentSchemaVersion = int32(len(migrations))

// loadConfig reads the stored config, creating the config table if this is a
// brand-new database. A database with no config row is treated as version 0,
// i.e. entirely unmigrated.
func (r *Repository) loadConfig() error {
	if _, err := r.db.Exec(sql_create_config); err != nil {
		return fmt.Errorf("creating config table: %w", err)
	}
	var config_bytes []byte
	if err := r.db.Get(&config_bytes, "SELECT proto FROM config LIMIT 1"); err != nil {
		if err != sql.ErrNoRows {
			return fmt.Errorf("error loading config: %w", err)
		}
	}
	if config_bytes != nil {
		if err := proto.Unmarshal(config_bytes, &r.Config); err != nil {
			return fmt.Errorf("error parsing config: %w", err)
		}
	}
	return nil
}

// migrate plays migrations forward until the database is at `target`. It is
// a no-op if the database is already there.
func (r *Repository) migrate(target int32) error {
	if target < 0 || target > CurrentSchemaVersion {
		return fmt.Errorf("no such schema version: %d", target)
	}
	version := r.Config.SchemaVersion
	if version > CurrentSchemaVersion {
		return fmt.Errorf(
			"database is at schema version %d, but this build only knows about version %d; upgrade crossme",
			version, CurrentSchemaVersion)
	}
	if version > target {
		return fmt.Errorf(
			"database is at schema version %d; migrating down to %d is not supported",
			version, target)
	}
	for version < target {
		m := &migrations[version]
		if err := r.applyMigration(m, version+1); err != nil {
			return fmt.Errorf("migrating to schema version %d (%s): %w", version+1, m.name, err)
		}
		version++
	}
	return nil
}

// applyMigration runs a single migration and stamps the new schema version
// into the config, atomically: either both land or neither does.
func (r *Repository) applyMigration(m *migration, version int32) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(m.sql); err != nil {
		return err
	}
	if m.fn != nil {
		if err := m.fn(tx); err != nil {
			return err
		}
	}

	config := proto.Clone(&r.Config).(*pb.Config)
	config.SchemaVersion = version
	if err := writeConfig(tx, config); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	r.Config.SchemaVersion = version
	return nil
}

func writeConfig(db sqlx.Execer, config *pb.Config) error {
	data, err := proto.Marshal(config)
	if err != nil {
		return err
	}
	_, err = db.Exec(sql_write_config, data)
	return err
}
