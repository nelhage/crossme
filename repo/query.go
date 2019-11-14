package repo

import (
	"database/sql"
	"errors"

	"crossme.app/src/pb"
	"github.com/golang/protobuf/proto"
)

var (
	ErrNoSuchPuzzle = errors.New("no such puzzle")
)

func (r *Repository) PuzzleIndex() ([]PuzzleIndex, error) {
	var out []PuzzleIndex
	if err := r.db.Select(&out, sql_query_puzzle_index); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *Repository) PuzzleById(id string) (*pb.Puzzle, error) {
	var data []byte
	if err := namedGet(r.db, &data, sql_query_puzzle_by_id, query_puzzle_by_id_args{
		Id: id,
	}); err != nil {
		if err == sql.ErrNoRows {
			err = ErrNoSuchPuzzle
		}
		return nil, err
	}
	var out pb.Puzzle
	if err := proto.Unmarshal(data, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
