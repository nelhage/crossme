// Code generated by protoc-gen-go-grpc. DO NOT EDIT.

package pb

import (
	context "context"
	grpc "google.golang.org/grpc"
	codes "google.golang.org/grpc/codes"
	status "google.golang.org/grpc/status"
)

// This is a compile-time assertion to ensure that this generated file
// is compatible with the grpc package it is being compiled against.
const _ = grpc.SupportPackageIsVersion7

// CrossMeClient is the client API for CrossMe service.
//
// For semantics around ctx use and closing/ending streaming RPCs, please refer to https://pkg.go.dev/google.golang.org/grpc/?tab=doc#ClientConn.NewStream.
type CrossMeClient interface {
	GetPuzzleIndex(ctx context.Context, in *GetPuzzleIndexArgs, opts ...grpc.CallOption) (*GetPuzzleIndexResponse, error)
	GetPuzzleById(ctx context.Context, in *GetPuzzleByIdArgs, opts ...grpc.CallOption) (*GetPuzzleResponse, error)
	NewGame(ctx context.Context, in *NewGameArgs, opts ...grpc.CallOption) (*NewGameResponse, error)
	GetGameById(ctx context.Context, in *GetGameByIdArgs, opts ...grpc.CallOption) (*GetGameResponse, error)
	UploadPuzzle(ctx context.Context, in *UploadPuzzleArgs, opts ...grpc.CallOption) (*UploadPuzzleResponse, error)
	UpdateFill(ctx context.Context, in *UpdateFillArgs, opts ...grpc.CallOption) (*UpdateFillResponse, error)
	Subscribe(ctx context.Context, in *SubscribeArgs, opts ...grpc.CallOption) (CrossMe_SubscribeClient, error)
}

type crossMeClient struct {
	cc grpc.ClientConnInterface
}

func NewCrossMeClient(cc grpc.ClientConnInterface) CrossMeClient {
	return &crossMeClient{cc}
}

var crossMeGetPuzzleIndexStreamDesc = &grpc.StreamDesc{
	StreamName: "GetPuzzleIndex",
}

func (c *crossMeClient) GetPuzzleIndex(ctx context.Context, in *GetPuzzleIndexArgs, opts ...grpc.CallOption) (*GetPuzzleIndexResponse, error) {
	out := new(GetPuzzleIndexResponse)
	err := c.cc.Invoke(ctx, "/crossme.CrossMe/GetPuzzleIndex", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

var crossMeGetPuzzleByIdStreamDesc = &grpc.StreamDesc{
	StreamName: "GetPuzzleById",
}

func (c *crossMeClient) GetPuzzleById(ctx context.Context, in *GetPuzzleByIdArgs, opts ...grpc.CallOption) (*GetPuzzleResponse, error) {
	out := new(GetPuzzleResponse)
	err := c.cc.Invoke(ctx, "/crossme.CrossMe/GetPuzzleById", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

var crossMeNewGameStreamDesc = &grpc.StreamDesc{
	StreamName: "NewGame",
}

func (c *crossMeClient) NewGame(ctx context.Context, in *NewGameArgs, opts ...grpc.CallOption) (*NewGameResponse, error) {
	out := new(NewGameResponse)
	err := c.cc.Invoke(ctx, "/crossme.CrossMe/NewGame", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

var crossMeGetGameByIdStreamDesc = &grpc.StreamDesc{
	StreamName: "GetGameById",
}

func (c *crossMeClient) GetGameById(ctx context.Context, in *GetGameByIdArgs, opts ...grpc.CallOption) (*GetGameResponse, error) {
	out := new(GetGameResponse)
	err := c.cc.Invoke(ctx, "/crossme.CrossMe/GetGameById", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

var crossMeUploadPuzzleStreamDesc = &grpc.StreamDesc{
	StreamName: "UploadPuzzle",
}

func (c *crossMeClient) UploadPuzzle(ctx context.Context, in *UploadPuzzleArgs, opts ...grpc.CallOption) (*UploadPuzzleResponse, error) {
	out := new(UploadPuzzleResponse)
	err := c.cc.Invoke(ctx, "/crossme.CrossMe/UploadPuzzle", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

var crossMeUpdateFillStreamDesc = &grpc.StreamDesc{
	StreamName: "UpdateFill",
}

func (c *crossMeClient) UpdateFill(ctx context.Context, in *UpdateFillArgs, opts ...grpc.CallOption) (*UpdateFillResponse, error) {
	out := new(UpdateFillResponse)
	err := c.cc.Invoke(ctx, "/crossme.CrossMe/UpdateFill", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

var crossMeSubscribeStreamDesc = &grpc.StreamDesc{
	StreamName:    "Subscribe",
	ServerStreams: true,
}

func (c *crossMeClient) Subscribe(ctx context.Context, in *SubscribeArgs, opts ...grpc.CallOption) (CrossMe_SubscribeClient, error) {
	stream, err := c.cc.NewStream(ctx, crossMeSubscribeStreamDesc, "/crossme.CrossMe/Subscribe", opts...)
	if err != nil {
		return nil, err
	}
	x := &crossMeSubscribeClient{stream}
	if err := x.ClientStream.SendMsg(in); err != nil {
		return nil, err
	}
	if err := x.ClientStream.CloseSend(); err != nil {
		return nil, err
	}
	return x, nil
}

type CrossMe_SubscribeClient interface {
	Recv() (*SubscribeEvent, error)
	grpc.ClientStream
}

type crossMeSubscribeClient struct {
	grpc.ClientStream
}

func (x *crossMeSubscribeClient) Recv() (*SubscribeEvent, error) {
	m := new(SubscribeEvent)
	if err := x.ClientStream.RecvMsg(m); err != nil {
		return nil, err
	}
	return m, nil
}

// CrossMeService is the service API for CrossMe service.
// Fields should be assigned to their respective handler implementations only before
// RegisterCrossMeService is called.  Any unassigned fields will result in the
// handler for that method returning an Unimplemented error.
type CrossMeService struct {
	GetPuzzleIndex func(context.Context, *GetPuzzleIndexArgs) (*GetPuzzleIndexResponse, error)
	GetPuzzleById  func(context.Context, *GetPuzzleByIdArgs) (*GetPuzzleResponse, error)
	NewGame        func(context.Context, *NewGameArgs) (*NewGameResponse, error)
	GetGameById    func(context.Context, *GetGameByIdArgs) (*GetGameResponse, error)
	UploadPuzzle   func(context.Context, *UploadPuzzleArgs) (*UploadPuzzleResponse, error)
	UpdateFill     func(context.Context, *UpdateFillArgs) (*UpdateFillResponse, error)
	Subscribe      func(*SubscribeArgs, CrossMe_SubscribeServer) error
}

func (s *CrossMeService) getPuzzleIndex(_ interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetPuzzleIndexArgs)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return s.GetPuzzleIndex(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     s,
		FullMethod: "/crossme.CrossMe/GetPuzzleIndex",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return s.GetPuzzleIndex(ctx, req.(*GetPuzzleIndexArgs))
	}
	return interceptor(ctx, in, info, handler)
}
func (s *CrossMeService) getPuzzleById(_ interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetPuzzleByIdArgs)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return s.GetPuzzleById(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     s,
		FullMethod: "/crossme.CrossMe/GetPuzzleById",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return s.GetPuzzleById(ctx, req.(*GetPuzzleByIdArgs))
	}
	return interceptor(ctx, in, info, handler)
}
func (s *CrossMeService) newGame(_ interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(NewGameArgs)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return s.NewGame(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     s,
		FullMethod: "/crossme.CrossMe/NewGame",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return s.NewGame(ctx, req.(*NewGameArgs))
	}
	return interceptor(ctx, in, info, handler)
}
func (s *CrossMeService) getGameById(_ interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetGameByIdArgs)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return s.GetGameById(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     s,
		FullMethod: "/crossme.CrossMe/GetGameById",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return s.GetGameById(ctx, req.(*GetGameByIdArgs))
	}
	return interceptor(ctx, in, info, handler)
}
func (s *CrossMeService) uploadPuzzle(_ interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(UploadPuzzleArgs)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return s.UploadPuzzle(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     s,
		FullMethod: "/crossme.CrossMe/UploadPuzzle",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return s.UploadPuzzle(ctx, req.(*UploadPuzzleArgs))
	}
	return interceptor(ctx, in, info, handler)
}
func (s *CrossMeService) updateFill(_ interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(UpdateFillArgs)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return s.UpdateFill(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     s,
		FullMethod: "/crossme.CrossMe/UpdateFill",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return s.UpdateFill(ctx, req.(*UpdateFillArgs))
	}
	return interceptor(ctx, in, info, handler)
}
func (s *CrossMeService) subscribe(_ interface{}, stream grpc.ServerStream) error {
	m := new(SubscribeArgs)
	if err := stream.RecvMsg(m); err != nil {
		return err
	}
	return s.Subscribe(m, &crossMeSubscribeServer{stream})
}

type CrossMe_SubscribeServer interface {
	Send(*SubscribeEvent) error
	grpc.ServerStream
}

type crossMeSubscribeServer struct {
	grpc.ServerStream
}

func (x *crossMeSubscribeServer) Send(m *SubscribeEvent) error {
	return x.ServerStream.SendMsg(m)
}

// RegisterCrossMeService registers a service implementation with a gRPC server.
func RegisterCrossMeService(s grpc.ServiceRegistrar, srv *CrossMeService) {
	srvCopy := *srv
	if srvCopy.GetPuzzleIndex == nil {
		srvCopy.GetPuzzleIndex = func(context.Context, *GetPuzzleIndexArgs) (*GetPuzzleIndexResponse, error) {
			return nil, status.Errorf(codes.Unimplemented, "method GetPuzzleIndex not implemented")
		}
	}
	if srvCopy.GetPuzzleById == nil {
		srvCopy.GetPuzzleById = func(context.Context, *GetPuzzleByIdArgs) (*GetPuzzleResponse, error) {
			return nil, status.Errorf(codes.Unimplemented, "method GetPuzzleById not implemented")
		}
	}
	if srvCopy.NewGame == nil {
		srvCopy.NewGame = func(context.Context, *NewGameArgs) (*NewGameResponse, error) {
			return nil, status.Errorf(codes.Unimplemented, "method NewGame not implemented")
		}
	}
	if srvCopy.GetGameById == nil {
		srvCopy.GetGameById = func(context.Context, *GetGameByIdArgs) (*GetGameResponse, error) {
			return nil, status.Errorf(codes.Unimplemented, "method GetGameById not implemented")
		}
	}
	if srvCopy.UploadPuzzle == nil {
		srvCopy.UploadPuzzle = func(context.Context, *UploadPuzzleArgs) (*UploadPuzzleResponse, error) {
			return nil, status.Errorf(codes.Unimplemented, "method UploadPuzzle not implemented")
		}
	}
	if srvCopy.UpdateFill == nil {
		srvCopy.UpdateFill = func(context.Context, *UpdateFillArgs) (*UpdateFillResponse, error) {
			return nil, status.Errorf(codes.Unimplemented, "method UpdateFill not implemented")
		}
	}
	if srvCopy.Subscribe == nil {
		srvCopy.Subscribe = func(*SubscribeArgs, CrossMe_SubscribeServer) error {
			return status.Errorf(codes.Unimplemented, "method Subscribe not implemented")
		}
	}
	sd := grpc.ServiceDesc{
		ServiceName: "crossme.CrossMe",
		Methods: []grpc.MethodDesc{
			{
				MethodName: "GetPuzzleIndex",
				Handler:    srvCopy.getPuzzleIndex,
			},
			{
				MethodName: "GetPuzzleById",
				Handler:    srvCopy.getPuzzleById,
			},
			{
				MethodName: "NewGame",
				Handler:    srvCopy.newGame,
			},
			{
				MethodName: "GetGameById",
				Handler:    srvCopy.getGameById,
			},
			{
				MethodName: "UploadPuzzle",
				Handler:    srvCopy.uploadPuzzle,
			},
			{
				MethodName: "UpdateFill",
				Handler:    srvCopy.updateFill,
			},
		},
		Streams: []grpc.StreamDesc{
			{
				StreamName:    "Subscribe",
				Handler:       srvCopy.subscribe,
				ServerStreams: true,
			},
		},
		Metadata: "crossme.proto",
	}

	s.RegisterService(&sd, nil)
}

// NewCrossMeService creates a new CrossMeService containing the
// implemented methods of the CrossMe service in s.  Any unimplemented
// methods will result in the gRPC server returning an UNIMPLEMENTED status to the client.
// This includes situations where the method handler is misspelled or has the wrong
// signature.  For this reason, this function should be used with great care and
// is not recommended to be used by most users.
func NewCrossMeService(s interface{}) *CrossMeService {
	ns := &CrossMeService{}
	if h, ok := s.(interface {
		GetPuzzleIndex(context.Context, *GetPuzzleIndexArgs) (*GetPuzzleIndexResponse, error)
	}); ok {
		ns.GetPuzzleIndex = h.GetPuzzleIndex
	}
	if h, ok := s.(interface {
		GetPuzzleById(context.Context, *GetPuzzleByIdArgs) (*GetPuzzleResponse, error)
	}); ok {
		ns.GetPuzzleById = h.GetPuzzleById
	}
	if h, ok := s.(interface {
		NewGame(context.Context, *NewGameArgs) (*NewGameResponse, error)
	}); ok {
		ns.NewGame = h.NewGame
	}
	if h, ok := s.(interface {
		GetGameById(context.Context, *GetGameByIdArgs) (*GetGameResponse, error)
	}); ok {
		ns.GetGameById = h.GetGameById
	}
	if h, ok := s.(interface {
		UploadPuzzle(context.Context, *UploadPuzzleArgs) (*UploadPuzzleResponse, error)
	}); ok {
		ns.UploadPuzzle = h.UploadPuzzle
	}
	if h, ok := s.(interface {
		UpdateFill(context.Context, *UpdateFillArgs) (*UpdateFillResponse, error)
	}); ok {
		ns.UpdateFill = h.UpdateFill
	}
	if h, ok := s.(interface {
		Subscribe(*SubscribeArgs, CrossMe_SubscribeServer) error
	}); ok {
		ns.Subscribe = h.Subscribe
	}
	return ns
}

// UnstableCrossMeService is the service API for CrossMe service.
// New methods may be added to this interface if they are added to the service
// definition, which is not a backward-compatible change.  For this reason,
// use of this type is not recommended.
type UnstableCrossMeService interface {
	GetPuzzleIndex(context.Context, *GetPuzzleIndexArgs) (*GetPuzzleIndexResponse, error)
	GetPuzzleById(context.Context, *GetPuzzleByIdArgs) (*GetPuzzleResponse, error)
	NewGame(context.Context, *NewGameArgs) (*NewGameResponse, error)
	GetGameById(context.Context, *GetGameByIdArgs) (*GetGameResponse, error)
	UploadPuzzle(context.Context, *UploadPuzzleArgs) (*UploadPuzzleResponse, error)
	UpdateFill(context.Context, *UpdateFillArgs) (*UpdateFillResponse, error)
	Subscribe(*SubscribeArgs, CrossMe_SubscribeServer) error
}
