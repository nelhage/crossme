package server

import (
	"context"
	"log"
	"sync"

	"golang.org/x/sync/errgroup"

	"crossme.app/src/crdt"
	"crossme.app/src/pb"
	"crossme.app/src/repo"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func New(repo *repo.Repository) *Server {
	return &Server{
		repo:    repo,
		puzzles: make(map[string]*puzzleState),
	}
}

type Server struct {
	sync.Mutex

	// Manages concurrency internally
	repo *repo.Repository

	// Guarded by Mutex
	puzzles map[string]*puzzleState
}

type puzzleState struct {
	sync.Mutex

	// Guarded by Mutex
	clients map[string]*clientState
	fill    *pb.Fill
}

type clientState struct {
	sync.Mutex

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

func (s *Server) getClient(puzzleid, nodeid string) (*puzzleState, *clientState) {
	s.Lock()
	if s.puzzles == nil {
		s.puzzles = make(map[string]*puzzleState)
	}
	puz, ok := s.puzzles[puzzleid]
	if !ok {
		puz = &puzzleState{
			clients: make(map[string]*clientState),
			fill: &pb.Fill{
				PuzzleId: puzzleid,
			},
		}
		s.puzzles[puzzleid] = puz
	}
	s.Unlock()

	puz.Lock()
	defer puz.Unlock()

	if client, ok := puz.clients[nodeid]; ok {
		close(client.wakeup)
	}
	client := &clientState{
		wakeup: make(chan struct{}, 1),
	}
	client.pending = puz.fill
	client.wakeup <- struct{}{}
	puz.clients[nodeid] = client
	return puz, client
}

func (s *Server) broadcastFill(ctx context.Context,
	puzzle *puzzleState,
	fill *pb.Fill) error {
	puzzle.Lock()
	defer puzzle.Unlock()

	if merged, err := crdt.Merge(puzzle.fill, fill); err != nil {
		puzzle.Unlock()
		return err
	} else {
		puzzle.fill = merged
	}

	for id, client := range puzzle.clients {
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

func (s *Server) streamFromClient(ctx context.Context,
	stream pb.CrossMe_InteractServer,
	puzzle *puzzleState,
	client *clientState) error {
	events := make(chan *pb.InteractEvent)
	go func() {
		defer close(events)
		for {
			evt, err := stream.Recv()
			if err != nil {
				return
			}
			events <- evt
		}
	}()

	for {
		select {
		case evt := <-events:
			if evt == nil {
				return nil
			}

			change := evt.GetFillChanged()
			if change == nil || change.Fill == nil {
				return status.Error(codes.InvalidArgument, "All events after the first must be FillChanged events with a Fill")
			}
			if err := s.broadcastFill(ctx, puzzle, change.Fill); err != nil {
				return err
			}
		case <-ctx.Done():
			return nil
		}
	}
}

func (s *Server) streamToClient(ctx context.Context,
	stream pb.CrossMe_InteractServer,
	puzzle *puzzleState,
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
			client.pending = &pb.Fill{PuzzleId: fill.PuzzleId}
			client.Unlock()
			if err := stream.Send(&pb.InteractResponse{Fill: fill}); err != nil {
				return err
			}
		}
	}
}

func (s *Server) Interact(stream pb.CrossMe_InteractServer) error {
	group, ctx := errgroup.WithContext(stream.Context())

	ev, err := stream.Recv()
	if err != nil {
		return err
	}
	init := ev.GetInitialize()
	if init == nil {
		return status.Error(codes.InvalidArgument, "The first event must be an initialize event")
	}
	puzzle, client := s.getClient(init.PuzzleId, init.NodeId)

	group.Go(func() error {
		return s.streamFromClient(ctx, stream, puzzle, client)
	})
	group.Go(func() error {
		return s.streamToClient(ctx, stream, puzzle, client)
	})
	return group.Wait()
}
