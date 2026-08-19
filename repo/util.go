package repo

import (
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/golang/protobuf/ptypes/timestamp"
	"github.com/jmoiron/sqlx"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type namedQueryer interface {
	NamedQuery(query string, arg any) (*sqlx.Rows, error)
}

func namedGet(q namedQueryer, out any, query string, arg any) error {
	rows, err := q.NamedQuery(query, arg)
	if err != nil {
		return err
	}
	defer rows.Close()
	if rows.Next() {
		return rows.Scan(out)
	}
	err = rows.Err()
	if err == nil {
		return sql.ErrNoRows
	}
	return err

}

func HashPuz(blob []byte) string {
	csum := sha256.Sum256(blob)
	return hex.EncodeToString(csum[:])
}

func NewId() string {
	// Generate a random ID
	var idbytes [8]byte
	if _, err := rand.Read(idbytes[:]); err != nil {
		panic(fmt.Errorf("Generating id: %v", err))
	}
	return hex.EncodeToString(idbytes[:])
}

func formatTimestamp(proto *timestamp.Timestamp) string {
	t := time.Unix(proto.Seconds, int64(proto.Nanos))
	return t.Format(time.RFC3339)
}

// formatTime and parseTime store timestamps as RFC3339 pinned to UTC, so
// that the stored strings compare (lexicographically, e.g. in SQL) the
// same way the times do.
func formatTime(t time.Time) string {
	return t.UTC().Format(time.RFC3339)
}

func parseTime(s string) (time.Time, error) {
	return time.Parse(time.RFC3339, s)
}

func parseTimestamp(s string) (*timestamppb.Timestamp, error) {
	t, err := parseTime(s)
	if err != nil {
		return nil, err
	}
	return timestamppb.New(t), nil
}
