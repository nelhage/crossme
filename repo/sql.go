package repo

const sql_init = `
CREATE TABLE IF NOT EXISTS config (
  proto blob
);

CREATE TABLE IF NOT EXISTS puzzles (
  meta__sha256 text unique primary key,
  proto blob,
  meta__created text
);

CREATE INDEX IF NOT EXISTS puzzles__created ON puzzles (meta__created);
`
