package repo

import (
	"database/sql"
	"fmt"
	"net/url"
	"strings"

	"github.com/golang/protobuf/proto"

	"crossme.app/src/pb"
	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
)

type Repository struct {
	db     *sqlx.DB
	Config pb.Config
}

func Open(dsn string) (*Repository, error) {
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
	if err := repo.init(); err != nil {
		repo.Close()
		return nil, err
	}
	return repo, nil
}

func (r *Repository) init() error {
	if _, err := r.db.Exec(sql_init); err != nil {
		return fmt.Errorf("error loading schema: %v", err)
	}
	var config_bytes []byte
	if err := r.db.Get(&config_bytes, "SELECT proto FROM config LIMIT 1"); err != nil {
		if err != sql.ErrNoRows {
			return fmt.Errorf("error loading config: %v", err)
		}
	}
	if config_bytes != nil {
		err := proto.Unmarshal(config_bytes, &r.Config)
		if err != nil {
			return err
		}
	}

	return nil
}

func (r *Repository) Close() error {
	return r.db.Close()
}
