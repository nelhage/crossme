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
