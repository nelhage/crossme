package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"flag"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"crossme.app/src/pb"
	"crossme.app/src/puz"
	"crossme.app/src/repo"
)

type Server struct {
	puz    *puz.PuzFile
	sha256 string
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	proto := repo.Puz2Proto(s.puz)
	out := struct {
		Puzzle *pb.Puzzle `json:"puzzle"`
	}{
		Puzzle: proto,
	}
	w.Header().Set("content-type", "application/json")
	err := json.NewEncoder(w).Encode(&out)
	if err != nil {
		log.Printf("encoding json: %v", err)
	}
}

func main() {
	var (
		bind = flag.String("bind", "localhost:4000", "bind address")
	)
	flag.Parse()
	args := flag.Args()
	if len(args) != 1 {
		log.Fatalf("Usage: %s puzzle.puz", os.Args[0])
	}

	data, err := ioutil.ReadFile(args[0])
	if err != nil {
		log.Fatalf("Reading puzzle: %v", err)
	}

	puzzle, err := puz.FromBytes(data)
	if err != nil {
		log.Fatalf("Loading puzzle: %v", err)
	}

	hash := sha256.Sum256(data)

	server := Server{puz: puzzle, sha256: hex.EncodeToString(hash[:])}
	log.Fatal(http.ListenAndServe(*bind, &server))
}
