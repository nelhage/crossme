package main

import (
	"flag"
	"io/ioutil"
	"log"
	"os"

	"crossme.app/src/puz"
	"crossme.app/src/repo"
)

func main() {
	var (
		db = flag.String("db", ":memory:", "sqlite database path")
	)
	flag.Parse()

	repository, err := repo.Open(*db)
	if err != nil {
		log.Fatal(err)
	}
	for _, arg := range flag.Args() {
		data, err := ioutil.ReadFile(os.Args[1])
		if err != nil {
			log.Fatalf("Reading puzzle: %v", err)
		}

		puzzle, err := puz.FromBytes(data)
		if err != nil {
			log.Fatalf("Loading puzzle: %v", err)
		}

		err = repository.InsertPuzzle(repo.Puz2Proto(puzzle), data)
		if err != nil {
			log.Fatalf("insert %q: %v", arg, err)
		}

	}
}
