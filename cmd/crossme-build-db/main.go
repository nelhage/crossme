package main

import (
	"flag"
	"log"
	"os"

	"crossme.app/src/formats"
	"crossme.app/src/repo"
)

func main() {
	var (
		db = flag.String("db", "/crossme:", "MySQL DSN")
	)
	flag.Parse()

	repository, err := repo.Open(*db)
	if err != nil {
		log.Fatal(err)
	}
	for _, arg := range flag.Args() {
		data, err := os.ReadFile(arg)
		if err != nil {
			log.Fatalf("Reading puzzle: %v", err)
		}

		puzzle, err := formats.Parse(data)
		if err != nil {
			log.Fatalf("Loading puzzle: %v", err)
		}

		_, err = repository.InsertPuzzle(repo.Puz2Proto(puzzle), data)
		if err != nil {
			log.Fatalf("insert %q: %v", arg, err)
		}

	}
}
