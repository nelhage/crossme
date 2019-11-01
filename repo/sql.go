package repo

const sql_init = `
CREATE TABLE IF NOT EXISTS config (
  proto blob
);

CREATE TABLE IF NOT EXISTS puzzles (
  proto blob,
  title text,
  meta__sha256 text unique primary key,
  meta__date text,
  meta__created text
);

CREATE INDEX IF NOT EXISTS puzzles__date ON puzzles (meta__date);

CREATE TABLE IF NOT EXISTS puz_files (
  sha256 text unique primary key,
  file blob
);
`

const sql_insert_puz_file = `
REPLACE INTO puz_files(sha256, file) VALUES (:sha256, :blob)
`

type insert_puz_file_args struct {
	Sha256 string `db:"sha256"`
	Blob   []byte `db:"blob"`
}

const sql_insert_puzzle = `
REPLACE INTO puzzles (proto, meta__sha256, title, meta__date)
VALUES (:proto, :sha256, :title, :date)
`

type insert_puzzle_args struct {
	Proto  []byte `db:"proto"`
	Sha256 string `db:"sha256"`
	Title  string `db:"title"`
	Date   string `db:"date"`
}

const sql_query_puzzle_index = `
SELECT meta__sha256 as sha256, title, meta__date as date
FROM puzzles
ORDER BY date DESC
`

const sql_query_puzzle_by_hash = `
SELECT proto
FROM puzzles
WHERE meta__sha256 LIKE ?
`
