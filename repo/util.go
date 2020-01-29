package repo

import (
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"

	"github.com/jmoiron/sqlx"
)

type namedQueryer interface {
	NamedQuery(query string, arg interface{}) (*sqlx.Rows, error)
}

func namedGet(q namedQueryer, out interface{}, query string, arg interface{}) error {
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
