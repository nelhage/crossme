package repo

import (
	"database/sql"
	"fmt"

	"github.com/golang/protobuf/proto"

	"crossme.app/src/pb"
	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
)

type Repository struct {
	db     *sqlx.DB
	Config pb.Config
}

func Open(path string) (*Repository, error) {
	sql, err := sqlx.Open("sqlite3", path)
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
		return fmt.Errorf("error loading scheman: %v", err)
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

func (r *Repository) FlushConfig() error {
	data, err := proto.Marshal(&r.Config)
	if err != nil {
		return err
	}
	_, err = r.db.Exec("INSERT OR REPLACE INTO config (proto) VALUES(?)", data)
	return err
}

func (r *Repository) Close() error {
	return r.db.Close()
}
