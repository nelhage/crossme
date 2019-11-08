package main

import (
	"context"

	"crossme.app/src/pb"
	"crossme.app/src/puz"
	"crossme.app/src/repo"
)

type Server struct {
	puz    *puz.PuzFile
	sha256 string
}

func (s *Server) GetPuzzleById(ctx context.Context, in *pb.GetPuzzleByIdArgs) (*pb.GetPuzzleResponse, error) {
	resp := &pb.GetPuzzleResponse{
		Puzzle: repo.Puz2Proto(s.puz),
	}
	return resp, nil
}
