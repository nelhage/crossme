package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"crossme.app/src/pb"
	"crossme.app/src/puz"
)

type Server struct {
	puz    *puz.PuzFile
	sha256 string
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	proto := pb.Puzzle{
		Title:     s.puz.Title,
		Author:    s.puz.Author,
		Copyright: s.puz.Copyright,
		Note:      s.puz.Notes,
		Width:     int32(s.puz.Width),
		Height:    int32(s.puz.Height),
		Metadata: &pb.Puzzle_Meta{
			Sha256: s.sha256,
		},
		Squares:     make([]*pb.Puzzle_Cell, 0, len(s.puz.Cells)),
		AcrossClues: make([]*pb.Puzzle_Clue, 0, len(s.puz.CluesAcross)),
		DownClues:   make([]*pb.Puzzle_Clue, 0, len(s.puz.CluesDown)),
	}
	for _, sq := range s.puz.Cells {
		proto.Squares = append(proto.Squares, &pb.Puzzle_Cell{
			Black:      sq.Black,
			Number:     int32(sq.Number),
			Circled:    sq.Circled,
			Fill:       sq.Fill,
			ClueAcross: int32(sq.WordAcross),
			ClueDown:   int32(sq.WordDown),
		})
	}
	for _, cl := range s.puz.CluesAcross {
		proto.AcrossClues = append(proto.AcrossClues,
			&pb.Puzzle_Clue{
				Number: int32(cl.Number),
				Text:   cl.Text,
			})
	}
	for _, cl := range s.puz.CluesDown {
		proto.DownClues = append(proto.DownClues,
			&pb.Puzzle_Clue{
				Number: int32(cl.Number),
				Text:   cl.Text,
			})
	}
	out := struct {
		Puzzle *pb.Puzzle `json:"puzzle"`
	}{
		Puzzle: &proto,
	}
	w.Header().Set("content-type", "application/json")
	err := json.NewEncoder(w).Encode(&out)
	if err != nil {
		log.Printf("encoding json: %v", err)
	}
}

func main() {
	if len(os.Args) != 2 {
		log.Fatalf("Usage: %s puzzle.puz", os.Args[0])
	}

	data, err := ioutil.ReadFile(os.Args[1])
	if err != nil {
		log.Fatalf("Reading puzzle: %v", err)
	}

	puzzle, err := puz.FromBytes(data)
	if err != nil {
		log.Fatalf("Loading puzzle: %v", err)
	}

	hash := sha256.Sum256(data)

	server := Server{puz: puzzle, sha256: hex.EncodeToString(hash[:])}
	log.Fatal(http.ListenAndServe("localhost:4000", &server))
}
