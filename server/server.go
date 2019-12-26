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
	clients map[string]*clientState
	fill    *pb.Fill
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

func (s *Server) getGame(gameid string) *gameState {
	s.Lock()
	defer s.Unlock()
	if s.games == nil {
		s.games = make(map[string]*gameState)
	}
	puz, ok := s.games[gameid]
	if !ok {
		puz = &gameState{
			clients: make(map[string]*clientState),
			fill:    &pb.Fill{},
		}
		s.games[gameid] = puz
	}
	return puz
}

func (s *Server) getClient(gameid, nodeid string) (*gameState, *clientState) {
	game := s.getGame(gameid)

	game.Lock()
	defer game.Unlock()

	if client, ok := game.clients[nodeid]; ok {
		close(client.wakeup)
	}
	client := &clientState{
		nodeid: nodeid,
		wakeup: make(chan struct{}, 1),
	}
	client.pending = game.fill
	client.wakeup <- struct{}{}
	game.clients[nodeid] = client
	return game, client
}

func (s *Server) stopSubscription(game *gameState, client *clientState) {
	game.Lock()
	defer game.Unlock()
	if client == game.clients[client.nodeid] {
		delete(game.clients, client.nodeid)
	}
}

func (s *Server) broadcastFill(ctx context.Context,
	game *gameState,
	fill *pb.Fill) error {
	game.Lock()
	defer game.Unlock()

	if merged, err := crdt.Merge(game.fill, fill); err != nil {
		game.Unlock()
		return err
	} else {
		game.fill = merged
	}

	for id, client := range game.clients {
		client.Lock()
		merged, err := crdt.Merge(client.pending, fill)
		if err != nil {
			log.Printf("merge error: client=%q err=%v", id, err)
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
	game := s.getGame(in.GameId)

	return &pb.UpdateFillResponse{}, s.broadcastFill(ctx, game, in.Fill)
}

func (s *Server) Subscribe(in *pb.SubscribeArgs, stream pb.CrossMe_SubscribeServer) error {
	ctx := stream.Context()

	game, client := s.getClient(in.GameId, in.NodeId)
	defer s.stopSubscription(game, client)

	return s.streamToClient(ctx, stream, game, client)
}
