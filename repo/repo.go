package repo

import (
	"database/sql"
	"fmt"

	"github.com/golang/protobuf/proto"

	"crossme.app/src/pb"
	"github.com/go-sql-driver/mysql"
	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
)

type Repository struct {
	db     *sqlx.DB
	Config pb.Config
}

func Open(dsn string) (*Repository, error) {
	if cfg, err := mysql.ParseDSN(dsn); err != nil {
		return nil, err
	} else {
		cfg.MultiStatements = true
		dsn = cfg.FormatDSN()
	}

	sql, err := sqlx.Open("mysql", dsn)
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
