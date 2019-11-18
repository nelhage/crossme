package main

import (
	"context"

	"crossme.app/src/pb"
	"crossme.app/src/repo"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Server struct {
	repo *repo.Repository
}

func (s *Server) GetPuzzleIndex(ctx context.Context, in *pb.GetPuzzleIndexArgs) (*pb.GetPuzzleIndexResponse, error) {
	index, err := s.repo.PuzzleIndex()
	if err != nil {
		return nil, err
	}
	return &pb.GetPuzzleIndexResponse{
		Puzzles: index,
	}, nil
}

func (s *Server) GetPuzzleById(ctx context.Context, in *pb.GetPuzzleByIdArgs) (*pb.GetPuzzleResponse, error) {
	puz, err := s.repo.PuzzleById(in.Id)
	if err == repo.ErrNoSuchPuzzle {
		return nil, status.Error(codes.NotFound, "no such puzzle")
	} else if err != nil {
		return nil, err
	}
	resp := &pb.GetPuzzleResponse{
		Puzzle: puz,
	}
	return resp, nil
}
