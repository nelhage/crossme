package repo

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"

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

func (r *Repository) PuzzleBySha256(sha string) (*pb.Puzzle, error) {
	if strings.IndexAny(sha, "_%") != -1 {
		return nil, ErrNoSuchPuzzle
	}
	var data []byte
	if err := r.db.Get(&data, sql_query_puzzle_by_hash, fmt.Sprintf("%s%%", sha)); err != nil {
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
