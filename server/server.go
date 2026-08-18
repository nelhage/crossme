package server

import (
	"context"
	"errors"
	"log"
	"sync"

	"connectrpc.com/connect"
	"crossme.app/src/auth"
	"crossme.app/src/crdt"
	"crossme.app/src/pb"
	"crossme.app/src/pb/pbconnect"
	"crossme.app/src/puz"
	"crossme.app/src/repo"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

var _ pbconnect.CrossMeHandler = &Server{}

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

	// The game's puzzle, kept for checking fills against the
	// solution. Immutable once loaded.
	puzzle *pb.Puzzle
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

func (s *Server) GetPuzzleIndex(ctx context.Context, req *connect.Request[pb.GetPuzzleIndexArgs]) (*connect.Response[pb.GetPuzzleIndexResponse], error) {
	index, err := s.repo.PuzzleIndex()
	if err != nil {
		return nil, err
	}
	return connect.NewResponse(&pb.GetPuzzleIndexResponse{
		Puzzles: index,
	}), nil
}

func (s *Server) GetPuzzleById(ctx context.Context, req *connect.Request[pb.GetPuzzleByIdArgs]) (*connect.Response[pb.GetPuzzleResponse], error) {
	puz, err := s.repo.PuzzleById(req.Msg.Id)
	if err == repo.ErrNoSuchPuzzle {
		return nil, connect.NewError(connect.CodeNotFound, errors.New("no such puzzle"))
	} else if err != nil {
		return nil, err
	}
	return connect.NewResponse(&pb.GetPuzzleResponse{
		Puzzle: puz,
	}), nil
}

func (s *Server) NewGame(ctx context.Context, req *connect.Request[pb.NewGameArgs]) (*connect.Response[pb.NewGameResponse], error) {
	// Anonymous creators leave the owner empty; nothing requires being
	// signed in.
	game, err := s.repo.NewGame(req.Msg.PuzzleId, auth.UserFromContext(ctx).GetId())
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(&pb.NewGameResponse{
		Game: game,
	}), nil
}

func (s *Server) GetGameById(ctx context.Context, req *connect.Request[pb.GetGameByIdArgs]) (*connect.Response[pb.GetGameResponse], error) {
	game, err := s.repo.GameById(req.Msg.Id)
	if err != nil {
		if err == repo.ErrNoSuchGame {
			err = connect.NewError(connect.CodeNotFound, errors.New("no such game"))
		}
		return nil, err
	}
	puz, err := s.repo.PuzzleById(game.PuzzleId)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(&pb.GetGameResponse{
		Game:   game,
		Puzzle: puz,
	}), nil
}

func (s *Server) UploadPuzzle(ctx context.Context, req *connect.Request[pb.UploadPuzzleArgs]) (*connect.Response[pb.UploadPuzzleResponse], error) {
	puzfile, err := puz.FromBytes(req.Msg.Data)
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}
	proto := repo.Puz2Proto(puzfile)

	_, err = s.repo.InsertPuzzle(proto, req.Msg.Data)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(&pb.UploadPuzzleResponse{
		Puzzle: proto,
	}), nil
}

// GetSelf reports who the caller is, per the session middleware; an
// anonymous caller gets an empty response. The session itself is created
// and destroyed by the HTTP endpoints in the auth package.
func (s *Server) GetSelf(ctx context.Context, req *connect.Request[pb.GetSelfArgs]) (*connect.Response[pb.GetSelfResponse], error) {
	return connect.NewResponse(&pb.GetSelfResponse{
		User: auth.UserFromContext(ctx),
	}), nil
}

func (s *Server) getGame(gameid string) (*gameState, error) {
	s.Lock()
	defer s.Unlock()
	if s.games == nil {
		s.games = make(map[string]*gameState)
	}
	gs, ok := s.games[gameid]
	if !ok {
		game, err := s.repo.GameById(gameid)
		if err != nil {
			return nil, err
		}
		puzzle, err := s.repo.PuzzleById(game.PuzzleId)
		if err != nil {
			return nil, err
		}
		gs = &gameState{
			clients: make(map[*clientState]struct{}),
			game:    game,
			puzzle:  puzzle,
		}
		s.games[gameid] = gs
	}
	return gs, nil
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

// fillSolved reports whether every non-black square in the puzzle has
// been filled in with its solution.
func fillSolved(puzzle *pb.Puzzle, fill *pb.Fill) bool {
	cells := make(map[uint32]*pb.Fill_Cell, len(fill.Cells))
	for _, c := range fill.Cells {
		cells[c.Index] = c
	}
	for i, sq := range puzzle.Squares {
		if sq.Black {
			continue
		}
		c := cells[uint32(i)]
		if c == nil || c.Fill != sq.Fill {
			return false
		}
	}
	return true
}

func (s *Server) broadcastFill(ctx context.Context,
	game *gameState,
	fill *pb.Fill) error {
	game.Lock()
	defer game.Unlock()

	// A complete game is frozen. Late deltas are dropped rather than
	// rejected: a client racing the completion broadcast will
	// legitimately send one more edit, and it shouldn't see an error.
	if game.game.Fill.GetComplete() {
		return nil
	}

	// Only the server declares a fill complete: a client-sent flag is
	// stripped, and completeness is re-derived by checking the merged
	// fill against the solution below.
	if fill.Complete {
		fill = proto.CloneOf(fill)
		fill.Complete = false
	}

	merged, err := crdt.Merge(game.game.Fill, fill)
	if err != nil {
		return err
	}

	broadcast := fill
	if fillSolved(game.puzzle, merged) {
		merged.Complete = true
		game.game.CompletedAt = timestamppb.Now()
		// Clients adopt the completed state via the merge's
		// "complete side wins wholesale" rule, so they must
		// receive the entire canonical fill, not the delta.
		broadcast = merged
	}
	game.game.Fill = merged
	if err := s.repo.UpdateGame(game.game); err != nil {
		log.Printf("persisting game %q: %v", game.game.Id, err)
	}

	for client, _ := range game.clients {
		client.Lock()
		merged, err := crdt.Merge(client.pending, broadcast)
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
	stream *connect.ServerStream[pb.SubscribeEvent],
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

func (s *Server) UpdateFill(ctx context.Context, req *connect.Request[pb.UpdateFillArgs]) (*connect.Response[pb.UpdateFillResponse], error) {
	game, err := s.getGame(req.Msg.GameId)
	if err != nil {
		if err == repo.ErrNoSuchGame {
			err = connect.NewError(connect.CodeNotFound, errors.New("no such game"))
		}
		return nil, err
	}

	if err := s.broadcastFill(ctx, game, req.Msg.Fill); err != nil {
		return nil, err
	}
	return connect.NewResponse(&pb.UpdateFillResponse{}), nil
}

func (s *Server) Subscribe(ctx context.Context, req *connect.Request[pb.SubscribeArgs], stream *connect.ServerStream[pb.SubscribeEvent]) error {
	game, client, err := s.startSubscription(req.Msg.GameId, req.Msg.NodeId)
	if err != nil {
		if err == repo.ErrNoSuchGame {
			err = connect.NewError(connect.CodeNotFound, errors.New("no such game"))
		}
		return err
	}
	defer s.stopSubscription(game, client)

	return s.streamToClient(ctx, stream, game, client)
}
