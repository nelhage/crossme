package repo

import (
	"database/sql"
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
	_, err = r.db.Exec("REPLACE INTO config (id, proto) VALUES(0, ?)", data)
	return err
}

func (r *Repository) InsertPuzzle(puz *pb.Puzzle, blob []byte) (string, error) {
	if puz.Metadata == nil {
		puz.Metadata = &pb.Puzzle_Meta{}
	}
	hash := HashPuz(blob)
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
		puz.Metadata.Id = id
		return id, nil
	}
	if err != nil && err != sql.ErrNoRows {
		return "", nil
	}

	puz.Metadata.Id = NewId()

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
			Id:      puz.Metadata.Id,
			Sha256:  sql.NullString{Valid: true, String: puz.Metadata.Sha256},
			Date:    puz.Metadata.Date,
			Created: formatTimestamp(puz.Metadata.Created),
		}); err != nil {
		return "", err
	}
	return puz.Metadata.Id, tx.Commit()
}

func (r *Repository) NewGame(puzzle_id string) (*pb.Game, error) {
	now := time.Now()
	game := pb.Game{
		Id:       NewId(),
		PuzzleId: puzzle_id,
		Fill:     &pb.Fill{},
		Created: &timestamp.Timestamp{
			Seconds: now.Unix(),
			Nanos:   int32(now.Nanosecond()),
		},
	}

	protobytes, err := proto.Marshal(&game)
	if err != nil {
		return nil, err
	}

	tx, err := r.db.Beginx()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	if _, err := tx.NamedExec(sql_insert_game,
		&insert_game_args{
			Proto:    protobytes,
			Id:       game.Id,
			PuzzleId: puzzle_id,
			Created:  formatTimestamp(game.Created),
		}); err != nil {
		return nil, err
	}

	return &game, tx.Commit()

}

func (r *Repository) UpdateGame(game *pb.Game) error {
	protobytes, err := proto.Marshal(game)
	if err != nil {
		return err
	}
	_, err = r.db.NamedExec(sql_update_game, &update_game_args{
		Id:    game.Id,
		Proto: protobytes,
	})
	return err
}
