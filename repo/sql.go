package repo

import "database/sql"

// The schema itself lives in migrate.go, as a sequence of migrations.

const sql_insert_puz_file = `
REPLACE INTO puz_files(sha256, file) VALUES (:sha256, :blob)
`

type insert_puz_file_args struct {
	Sha256 string `db:"sha256"`
	Blob   []byte `db:"blob"`
}

const sql_insert_puzzle = `
INSERT INTO puzzles (proto, title, meta__id, meta__sha256, meta__date, meta__created)
VALUES (:proto, :title, :id, :sha256, :date, :created)
`

type insert_puzzle_args struct {
	Proto   []byte         `db:"proto"`
	Title   string         `db:"title"`
	Id      string         `db:"id"`
	Sha256  sql.NullString `db:"sha256"`
	Date    string         `db:"date"`
	Created string         `db:"created"`
}

const sql_query_puzzle_index = `
SELECT meta__id as id, title, meta__date as date
FROM puzzles
ORDER BY date DESC
`

const sql_query_puzzle_by_id = `
SELECT proto
FROM puzzles
WHERE meta__id = :id
`

type query_puzzle_by_id_args struct {
	Id string `db:"id"`
}

const sql_query_id_by_hash = `
SELECT meta__id as id
FROM puzzles
WHERE meta__sha256 = :sha256
`

type query_id_by_hash_args struct {
	Sha256 string `db:"sha256"`
}

const sql_insert_game = `
INSERT INTO games (proto, id, puzzle_id, created, owner_id)
VALUES (:proto, :id, :puzzle_id, :created, :owner_id)
`

type insert_game_args struct {
	Proto    []byte         `db:"proto"`
	Id       string         `db:"id"`
	PuzzleId string         `db:"puzzle_id"`
	Created  string         `db:"created"`
	OwnerId  sql.NullString `db:"owner_id"`
}

const sql_query_game_by_id = `
SELECT proto
FROM games
WHERE id = :id
`

type query_game_by_id_args struct {
	Id string `db:"id"`
}

const sql_update_game = `
UPDATE games
SET proto = :proto, completed_at = :completed_at
WHERE id = :id
`

type update_game_args struct {
	Id          string         `db:"id"`
	Proto       []byte         `db:"proto"`
	CompletedAt sql.NullString `db:"completed_at"`
}

const sql_insert_user = `
INSERT INTO users (proto, id, created)
VALUES (:proto, :id, :created)
`

type insert_user_args struct {
	Proto   []byte `db:"proto"`
	Id      string `db:"id"`
	Created string `db:"created"`
}

const sql_update_user = `
UPDATE users
SET proto = :proto
WHERE id = :id
`

type update_user_args struct {
	Id    string `db:"id"`
	Proto []byte `db:"proto"`
}

const sql_insert_identity = `
INSERT INTO identities (proto, provider, subject, user_id)
VALUES (:proto, :provider, :subject, :user_id)
`

type insert_identity_args struct {
	Proto    []byte `db:"proto"`
	Provider string `db:"provider"`
	Subject  string `db:"subject"`
	UserId   string `db:"user_id"`
}

const sql_query_user_by_id = `
SELECT proto
FROM users
WHERE id = :id
`

type query_user_by_id_args struct {
	Id string `db:"id"`
}

const sql_query_user_by_identity = `
SELECT users.proto
FROM identities
JOIN users ON users.id = identities.user_id
WHERE identities.provider = :provider AND identities.subject = :subject
`

type query_user_by_identity_args struct {
	Provider string `db:"provider"`
	Subject  string `db:"subject"`
}

const sql_insert_session = `
INSERT INTO sessions (token_hash, user_id, created, expires)
VALUES (:token_hash, :user_id, :created, :expires)
`

type insert_session_args struct {
	TokenHash string `db:"token_hash"`
	UserId    string `db:"user_id"`
	Created   string `db:"created"`
	Expires   string `db:"expires"`
}

const sql_query_session = `
SELECT user_id, expires
FROM sessions
WHERE token_hash = :token_hash
`

type session_args struct {
	TokenHash string `db:"token_hash"`
}

const sql_update_session_expires = `
UPDATE sessions
SET expires = :expires
WHERE token_hash = :token_hash
`

type update_session_expires_args struct {
	TokenHash string `db:"token_hash"`
	Expires   string `db:"expires"`
}

const sql_delete_session = `
DELETE FROM sessions
WHERE token_hash = :token_hash
`

// Timestamps are stored as RFC3339 in UTC (see formatTime), so string
// comparison agrees with time comparison.
const sql_delete_expired_sessions = `
DELETE FROM sessions
WHERE expires < :now
`

type delete_expired_sessions_args struct {
	Now string `db:"now"`
}
