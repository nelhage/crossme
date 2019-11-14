package repo

import (
	"database/sql"

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
