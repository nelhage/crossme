package server

import (
	"context"
	"log"
	"sync"

	"crossme.app/src/crdt"
	"crossme.app/src/pb"
	"crossme.app/src/puz"
	"crossme.app/src/repo"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

var _ pb.UnstableCrossMeService = &Server{}

func New(repo *repo.Repository) *Server {
	return &Server{
		repo:  repo,
		games: make(map[string]*gameState),
	}
}

type Server struct {
	sync.Mutex

	// Manages concurrency internally
	repo *repo.Repository

	// Guarded by Mutex
	games map[string]*gameState
}

type gameState struct {
	sync.Mutex

	// Guarded by Mutex
	clients map[*clientState]struct{}
	game    *pb.Game
}

type clientState struct {
	sync.Mutex
	nodeid string

	// pending holds the pending fills that have been accumulated
	// on the server and not yet broadcast to this client
	pending *pb.Fill

	// whenever pending is updated, a message is sent on this
	// channel to wake up the goroutine waiting on further fill
	// events
	wakeup chan struct{}
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

func (s *Server) NewGame(ctx context.Context, in *pb.NewGameArgs) (*pb.NewGameResponse, error) {
	game, err := s.repo.NewGame(in.PuzzleId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.NewGameResponse{
		Game: game,
	}, nil
}

func (s *Server) GetGameById(ctx context.Context, in *pb.GetGameByIdArgs) (*pb.GetGameResponse, error) {
	game, err := s.repo.GameById(in.Id)
	if err != nil {
		if err == repo.ErrNoSuchGame {
			err = status.Error(codes.NotFound, "no such game")
		}
		return nil, err
	}
	puz, err := s.repo.PuzzleById(game.PuzzleId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.GetGameResponse{
		Game:   game,
		Puzzle: puz,
	}, nil
}

func (s *Server) UploadPuzzle(ctx context.Context, in *pb.UploadPuzzleArgs) (*pb.UploadPuzzleResponse, error) {
	puzfile, err := puz.FromBytes(in.Data)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}
	proto := repo.Puz2Proto(puzfile)

	_, err = s.repo.InsertPuzzle(proto, in.Data)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.UploadPuzzleResponse{
		Puzzle: proto,
	}, nil
}

func (s *Server) getGame(gameid string) (*gameState, error) {
	s.Lock()
	defer s.Unlock()
	if s.games == nil {
		s.games = make(map[string]*gameState)
	}
	puz, ok := s.games[gameid]
	if !ok {
		game, err := s.repo.GameById(gameid)
		if err != nil {
			return nil, err
		}
		puz = &gameState{
			clients: make(map[*clientState]struct{}),
			game:    game,
		}
		s.games[gameid] = puz
	}
	return puz, nil
}

func (s *Server) startSubscription(gameid, nodeid string) (*gameState, *clientState, error) {
	game, err := s.getGame(gameid)
	if err != nil {
		return nil, nil, err
	}

	game.Lock()
	defer game.Unlock()

	client := &clientState{
		nodeid: nodeid,
		wakeup: make(chan struct{}, 1),
	}
	client.pending = game.game.Fill
	client.wakeup <- struct{}{}
	game.clients[client] = struct{}{}
	return game, client, nil
}

func (s *Server) stopSubscription(game *gameState, client *clientState) {
	game.Lock()
	defer game.Unlock()
	delete(game.clients, client)
}

func (s *Server) broadcastFill(ctx context.Context,
	game *gameState,
	fill *pb.Fill) error {
	game.Lock()
	defer game.Unlock()

	if merged, err := crdt.Merge(game.game.Fill, fill); err != nil {
		game.Unlock()
		return err
	} else {
		game.game.Fill = merged
		s.repo.UpdateGame(game.game)
	}

	for client, _ := range game.clients {
		client.Lock()
		merged, err := crdt.Merge(client.pending, fill)
		if err != nil {
			log.Printf("merge error: client=%q err=%v", client.nodeid, err)
		} else {
			client.pending = merged
		}
		client.Unlock()
		select {
		case client.wakeup <- struct{}{}:
		default:
		}
	}
	return nil
}

func (s *Server) streamToClient(ctx context.Context,
	stream pb.CrossMe_SubscribeServer,
	game *gameState,
	client *clientState) error {
	for {
		select {
		case <-ctx.Done():
			return nil
		case _, ok := <-client.wakeup:
			if !ok {
				return nil
			}
			client.Lock()
			fill := client.pending
			client.pending = &pb.Fill{}
			client.Unlock()
			if err := stream.Send(&pb.SubscribeEvent{Fill: fill}); err != nil {
				return err
			}
		}
	}
}

func (s *Server) UpdateFill(ctx context.Context, in *pb.UpdateFillArgs) (*pb.UpdateFillResponse, error) {
	game, err := s.getGame(in.GameId)
	if err != nil {
		if err == repo.ErrNoSuchGame {
			err = status.Error(codes.NotFound, "no such game")
		}
		return nil, err
	}

	return &pb.UpdateFillResponse{}, s.broadcastFill(ctx, game, in.Fill)
}

func (s *Server) Subscribe(in *pb.SubscribeArgs, stream pb.CrossMe_SubscribeServer) error {
	ctx := stream.Context()

	game, client, err := s.startSubscription(in.GameId, in.NodeId)
	if err != nil {
		if err == repo.ErrNoSuchGame {
			err = status.Error(codes.NotFound, "no such game")
		}
		return err
	}
	defer s.stopSubscription(game, client)

	return s.streamToClient(ctx, stream, game, client)
}
