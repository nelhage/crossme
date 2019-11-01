package repo

import (
	"crypto/sha256"
	"encoding/hex"
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
			Proto:  protobytes,
			Title:  puz.Title,
			Sha256: puz.Metadata.Sha256,
			Date:   puz.Metadata.Date,
		}); err != nil {
		return err
	}
	return tx.Commit()
}
