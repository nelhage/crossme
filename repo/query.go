package repo

import (
	"database/sql"
	"errors"

	"crossme.app/src/pb"
	"google.golang.org/protobuf/proto"
)

var (
	ErrNoSuchPuzzle  = errors.New("no such puzzle")
	ErrNoSuchGame    = errors.New("no such game")
	ErrNoSuchUser    = errors.New("no such user")
	ErrNoSuchSession = errors.New("no such session")
)

// PuzzleIndex lists every puzzle, newest first. user_id is the caller,
// whose own game of each puzzle (if any) is attached to the entry; pass ""
// for an anonymous caller, who gets the bare index.
func (r *Repository) PuzzleIndex(user_id string) ([]*pb.PuzzleIndex, error) {
	rows, err := r.db.NamedQuery(sql_query_puzzle_index, query_puzzle_index_args{
		UserId: user_id,
	})
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*pb.PuzzleIndex
	for rows.Next() {
		var row puzzle_index_row
		if err := rows.StructScan(&row); err != nil {
			return nil, err
		}
		puz := &pb.PuzzleIndex{
			Id:     row.Id,
			Title:  row.Title,
			Author: row.Author,
			Date:   row.Date,
		}
		if row.GameId.Valid {
			game := &pb.PuzzleIndex_Game{Id: row.GameId.String}
			if game.LastPlayed, err = parseTimestamp(row.LastPlayed.String); err != nil {
				return nil, err
			}
			if row.CompletedAt.Valid {
				if game.CompletedAt, err = parseTimestamp(row.CompletedAt.String); err != nil {
					return nil, err
				}
			}
			puz.Game = game
		}
		out = append(out, puz)
	}
	if err := rows.Err(); err != nil {
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

// GamesForUser returns the user's play history (as recorded by
// RecordPlay), most recently played first.
func (r *Repository) GamesForUser(user_id string) ([]*pb.MyGame, error) {
	rows, err := r.db.NamedQuery(sql_query_games_for_user, query_games_for_user_args{
		UserId: user_id,
	})
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*pb.MyGame
	for rows.Next() {
		var row games_for_user_row
		if err := rows.StructScan(&row); err != nil {
			return nil, err
		}
		var puzzle pb.Puzzle
		if err := proto.Unmarshal(row.Puzzle, &puzzle); err != nil {
			return nil, err
		}
		game := &pb.MyGame{
			GameId:   row.GameId,
			PuzzleId: row.PuzzleId,
			Title:    puzzle.Title,
			Author:   puzzle.Author,
		}
		if game.FirstPlayed, err = parseTimestamp(row.FirstPlayed); err != nil {
			return nil, err
		}
		if game.LastPlayed, err = parseTimestamp(row.LastPlayed); err != nil {
			return nil, err
		}
		if row.CompletedAt.Valid {
			if game.CompletedAt, err = parseTimestamp(row.CompletedAt.String); err != nil {
				return nil, err
			}
		}
		out = append(out, game)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *Repository) GameById(id string) (*pb.Game, error) {
	var data []byte
	if err := namedGet(r.db, &data, sql_query_game_by_id, query_game_by_id_args{
		Id: id,
	}); err != nil {
		if err == sql.ErrNoRows {
			err = ErrNoSuchGame
		}
		return nil, err
	}
	var out pb.Game
	if err := proto.Unmarshal(data, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
