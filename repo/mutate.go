package repo

import (
	"database/sql"
	"time"

	"crossme.app/src/pb"
	"google.golang.org/protobuf/proto"
	"github.com/golang/protobuf/ptypes/timestamp"
)

func (r *Repository) FlushConfig() error {
	return writeConfig(r.db, &r.Config)
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

// NewGame creates a game. `owner_id` is the creating user's id, or empty
// for a game created anonymously (stored as NULL).
func (r *Repository) NewGame(puzzle_id string, owner_id string) (*pb.Game, error) {
	now := time.Now()
	game := pb.Game{
		Id:       NewId(),
		PuzzleId: puzzle_id,
		OwnerId:  owner_id,
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
			OwnerId:  sql.NullString{Valid: owner_id != "", String: owner_id},
		}); err != nil {
		return nil, err
	}

	return &game, tx.Commit()

}

// RecordPlay notes that a signed-in user opened a game, creating their
// play-history entry or refreshing its last-played time.
func (r *Repository) RecordPlay(game_id, user_id string) error {
	return r.RecordPlayAt(game_id, user_id, time.Now())
}

// RecordPlayAt merges a play at an arbitrary time into a user's history:
// the game's first/last-played window is widened to include `at`.
// Idempotent, so the client can re-sync its local history freely. Plays
// of games that don't exist are silently ignored.
func (r *Repository) RecordPlayAt(game_id, user_id string, at time.Time) error {
	_, err := r.db.NamedExec(sql_record_play, &record_play_args{
		UserId:   user_id,
		GameId:   game_id,
		PlayedAt: formatTime(at),
	})
	return err
}

func (r *Repository) UpdateGame(game *pb.Game) error {
	protobytes, err := proto.Marshal(game)
	if err != nil {
		return err
	}
	var completedAt sql.NullString
	if game.CompletedAt != nil {
		completedAt = sql.NullString{
			Valid:  true,
			String: formatTimestamp(game.CompletedAt),
		}
	}
	_, err = r.db.NamedExec(sql_update_game, &update_game_args{
		Id:          game.Id,
		Proto:       protobytes,
		CompletedAt: completedAt,
	})
	return err
}
