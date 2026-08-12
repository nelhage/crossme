package repo

import (
	"context"
	"fmt"
	"net/url"
	"strings"

	"crossme.app/src/pb"
	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
)

type Repository struct {
	db     *sqlx.DB
	Config pb.Config
}

func Open(dsn string) (*Repository, error) {
	return open(dsn, CurrentSchemaVersion)
}

// open opens a database and migrates it to `target`. Callers other than
// tests always want CurrentSchemaVersion.
func open(dsn string, target int32) (*Repository, error) {
	bits := strings.SplitN(dsn, "?", 2)
	var q url.Values
	if len(bits) > 1 {
		var err error
		q, err = url.ParseQuery(bits[1])
		if err != nil {
			return nil, fmt.Errorf("Parsing DSN %q: %w", dsn, err)
		}
	} else {
		q = make(url.Values)
	}

	q.Set("_journal", "wal")
	q.Set("_busy_timeout", "5000")

	dsn = bits[0] + "?" + q.Encode()

	sql, err := sqlx.Open("sqlite3", dsn)
	if err != nil {
		return nil, err
	}

	repo := &Repository{db: sql}
	if err := repo.init(target); err != nil {
		repo.Close()
		return nil, err
	}
	return repo, nil
}

func (r *Repository) init(target int32) error {
	if err := r.loadConfig(); err != nil {
		return err
	}
	return r.migrate(target)
}

// Ping checks that the database is still usable. It's meant for health
// checks, not for use on the request path.
func (r *Repository) Ping(ctx context.Context) error {
	return r.db.PingContext(ctx)
}

func (r *Repository) Close() error {
	return r.db.Close()
}
