package repo

import (
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"time"

	"crossme.app/src/pb"
	"github.com/golang/protobuf/proto"
	"github.com/golang/protobuf/ptypes/timestamp"
)

func (r *Repository) FlushConfig() error {
	data, err := proto.Marshal(&r.Config)
	if err != nil {
		return err
	}
	_, err = r.db.Exec("INSERT OR REPLACE INTO config (proto) VALUES(?)", data)
	return err
}

func (r *Repository) InsertPuzzle(puz *pb.Puzzle, blob []byte) (string, error) {
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
		return "", err
	}
	defer tx.Rollback()

	var id string
	err = namedGet(tx, &id, sql_query_id_by_hash, query_id_by_hash_args{
		Sha256: hash,
	})
	if err == nil {
		return id, nil
	}
	if err != nil && err != sql.ErrNoRows {
		return "", nil
	}

	// Generate a random ID
	var idbytes [8]byte
	if _, err := rand.Read(idbytes[:]); err != nil {
		return "", fmt.Errorf("Generating id: %v", err)
	}
	id = hex.EncodeToString(idbytes[:])

	puz.Metadata.Id = id

	if _, err := tx.NamedExec(sql_insert_puz_file,
		&insert_puz_file_args{
			Sha256: hash,
			Blob:   blob,
		}); err != nil {
		return "", err
	}
	protobytes, err := proto.Marshal(puz)
	if err != nil {
		return "", err
	}
	if _, err := tx.NamedExec(sql_insert_puzzle,
		&insert_puzzle_args{
			Proto:   protobytes,
			Title:   puz.Title,
			Id:      id,
			Sha256:  sql.NullString{Valid: true, String: puz.Metadata.Sha256},
			Date:    puz.Metadata.Date,
			Created: puz.Metadata.Created.String(),
		}); err != nil {
		return "", err
	}
	return id, tx.Commit()
}
