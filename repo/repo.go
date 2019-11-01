package repo

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/golang/protobuf/proto"
	"github.com/golang/protobuf/ptypes/timestamp"

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

func (r *Repository) InsertPuzzle(puz *pb.Puzzle, blob []byte) error {
	csum := sha256.Sum256(blob)
	hash := hex.EncodeToString(csum[:])
	if puz.Metadata == nil {
		puz.Metadata = &pb.Puzzle_Meta{}
	}
	puz.Metadata.Sha256 = hash
	if puz.Metadata.Created == nil {
		now := time.Now()
		puz.Metadata.Created = &timestamp.Timestamp{
			Seconds: now.Unix(),
			Nanos:   int32(now.Nanosecond()),
		}
	}

	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}
	if _, err := tx.NamedExec(sql_insert_puz_file,
		&insert_puz_file_args{
			Sha256: hash,
			Blob:   blob,
		}); err != nil {
		return err
	}
	protobytes, err := proto.Marshal(puz)
	if err != nil {
		return err
	}
	if _, err := tx.NamedExec(sql_insert_puzzle,
		&insert_puzzle_args{
			Sha256: puz.Metadata.Sha256,
			Proto:  protobytes,
			Date:   puz.Metadata.Date,
		}); err != nil {
		return err
	}
	return tx.Commit()
}
