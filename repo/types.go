package repo

type PuzzleIndex struct {
	Sha256 string `db:"sha256"`
	Title  string `db:"title"`
	Date   string `db:"date"`
}
