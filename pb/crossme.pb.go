// Code generated by protoc-gen-go. DO NOT EDIT.
// source: crossme.proto

package pb

import (
	context "context"
	fmt "fmt"
	proto "github.com/golang/protobuf/proto"
	grpc "google.golang.org/grpc"
	codes "google.golang.org/grpc/codes"
	status "google.golang.org/grpc/status"
	math "math"
)

// Reference imports to suppress errors if they are not otherwise used.
var _ = proto.Marshal
var _ = fmt.Errorf
var _ = math.Inf

// This is a compile-time assertion to ensure that this generated file
// is compatible with the proto package it is being compiled against.
// A compilation error at this line likely means your copy of the
// proto package needs to be updated.
const _ = proto.ProtoPackageIsVersion3 // please upgrade the proto package

type GetPuzzleByIdArgs struct {
	Id                   string   `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *GetPuzzleByIdArgs) Reset()         { *m = GetPuzzleByIdArgs{} }
func (m *GetPuzzleByIdArgs) String() string { return proto.CompactTextString(m) }
func (*GetPuzzleByIdArgs) ProtoMessage()    {}
func (*GetPuzzleByIdArgs) Descriptor() ([]byte, []int) {
	return fileDescriptor_cc86cf064ca37a06, []int{0}
}

func (m *GetPuzzleByIdArgs) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_GetPuzzleByIdArgs.Unmarshal(m, b)
}
func (m *GetPuzzleByIdArgs) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_GetPuzzleByIdArgs.Marshal(b, m, deterministic)
}
func (m *GetPuzzleByIdArgs) XXX_Merge(src proto.Message) {
	xxx_messageInfo_GetPuzzleByIdArgs.Merge(m, src)
}
func (m *GetPuzzleByIdArgs) XXX_Size() int {
	return xxx_messageInfo_GetPuzzleByIdArgs.Size(m)
}
func (m *GetPuzzleByIdArgs) XXX_DiscardUnknown() {
	xxx_messageInfo_GetPuzzleByIdArgs.DiscardUnknown(m)
}

var xxx_messageInfo_GetPuzzleByIdArgs proto.InternalMessageInfo

func (m *GetPuzzleByIdArgs) GetId() string {
	if m != nil {
		return m.Id
	}
	return ""
}

type GetPuzzleResponse struct {
	Puzzle               *Puzzle  `protobuf:"bytes,1,opt,name=puzzle,proto3" json:"puzzle,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *GetPuzzleResponse) Reset()         { *m = GetPuzzleResponse{} }
func (m *GetPuzzleResponse) String() string { return proto.CompactTextString(m) }
func (*GetPuzzleResponse) ProtoMessage()    {}
func (*GetPuzzleResponse) Descriptor() ([]byte, []int) {
	return fileDescriptor_cc86cf064ca37a06, []int{1}
}

func (m *GetPuzzleResponse) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_GetPuzzleResponse.Unmarshal(m, b)
}
func (m *GetPuzzleResponse) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_GetPuzzleResponse.Marshal(b, m, deterministic)
}
func (m *GetPuzzleResponse) XXX_Merge(src proto.Message) {
	xxx_messageInfo_GetPuzzleResponse.Merge(m, src)
}
func (m *GetPuzzleResponse) XXX_Size() int {
	return xxx_messageInfo_GetPuzzleResponse.Size(m)
}
func (m *GetPuzzleResponse) XXX_DiscardUnknown() {
	xxx_messageInfo_GetPuzzleResponse.DiscardUnknown(m)
}

var xxx_messageInfo_GetPuzzleResponse proto.InternalMessageInfo

func (m *GetPuzzleResponse) GetPuzzle() *Puzzle {
	if m != nil {
		return m.Puzzle
	}
	return nil
}

func init() {
	proto.RegisterType((*GetPuzzleByIdArgs)(nil), "crossme.GetPuzzleByIdArgs")
	proto.RegisterType((*GetPuzzleResponse)(nil), "crossme.GetPuzzleResponse")
}

func init() { proto.RegisterFile("crossme.proto", fileDescriptor_cc86cf064ca37a06) }

var fileDescriptor_cc86cf064ca37a06 = []byte{
	// 164 bytes of a gzipped FileDescriptorProto
	0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xff, 0xe2, 0xe2, 0x4d, 0x2e, 0xca, 0x2f,
	0x2e, 0xce, 0x4d, 0xd5, 0x2b, 0x28, 0xca, 0x2f, 0xc9, 0x17, 0x62, 0x87, 0x72, 0xa5, 0x78, 0x0a,
	0x4a, 0xab, 0xaa, 0x72, 0xa0, 0xc2, 0x4a, 0xca, 0x5c, 0x82, 0xee, 0xa9, 0x25, 0x01, 0x60, 0x21,
	0xa7, 0x4a, 0xcf, 0x14, 0xc7, 0xa2, 0xf4, 0x62, 0x21, 0x3e, 0x2e, 0xa6, 0xcc, 0x14, 0x09, 0x46,
	0x05, 0x46, 0x0d, 0xce, 0x20, 0xa6, 0xcc, 0x14, 0x25, 0x1b, 0x24, 0x45, 0x41, 0xa9, 0xc5, 0x05,
	0xf9, 0x79, 0xc5, 0xa9, 0x42, 0xea, 0x5c, 0x6c, 0x10, 0x93, 0xc0, 0x0a, 0xb9, 0x8d, 0xf8, 0xf5,
	0x60, 0x16, 0x42, 0x15, 0x42, 0xa5, 0x8d, 0x82, 0xb8, 0xd8, 0x9d, 0x41, 0x32, 0xbe, 0xa9, 0x42,
	0xee, 0x5c, 0xbc, 0x28, 0xb6, 0x09, 0x49, 0xc1, 0x35, 0x61, 0xb8, 0x42, 0x0a, 0x8b, 0x1c, 0xcc,
	0x72, 0x27, 0x91, 0x28, 0x21, 0x98, 0x64, 0x62, 0x41, 0x81, 0x7e, 0x71, 0x51, 0xb2, 0x7e, 0x41,
	0x52, 0x12, 0x1b, 0xd8, 0x4f, 0xc6, 0x80, 0x00, 0x00, 0x00, 0xff, 0xff, 0xdf, 0x7b, 0x6c, 0xfb,
	0xfb, 0x00, 0x00, 0x00,
}

// Reference imports to suppress errors if they are not otherwise used.
var _ context.Context
var _ grpc.ClientConn

// This is a compile-time assertion to ensure that this generated file
// is compatible with the grpc package it is being compiled against.
const _ = grpc.SupportPackageIsVersion4

// CrossMeClient is the client API for CrossMe service.
//
// For semantics around ctx use and closing/ending streaming RPCs, please refer to https://godoc.org/google.golang.org/grpc#ClientConn.NewStream.
type CrossMeClient interface {
	GetPuzzleById(ctx context.Context, in *GetPuzzleByIdArgs, opts ...grpc.CallOption) (*GetPuzzleResponse, error)
}

type crossMeClient struct {
	cc *grpc.ClientConn
}

func NewCrossMeClient(cc *grpc.ClientConn) CrossMeClient {
	return &crossMeClient{cc}
}

func (c *crossMeClient) GetPuzzleById(ctx context.Context, in *GetPuzzleByIdArgs, opts ...grpc.CallOption) (*GetPuzzleResponse, error) {
	out := new(GetPuzzleResponse)
	err := c.cc.Invoke(ctx, "/crossme.CrossMe/GetPuzzleById", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

// CrossMeServer is the server API for CrossMe service.
type CrossMeServer interface {
	GetPuzzleById(context.Context, *GetPuzzleByIdArgs) (*GetPuzzleResponse, error)
}

// UnimplementedCrossMeServer can be embedded to have forward compatible implementations.
type UnimplementedCrossMeServer struct {
}

func (*UnimplementedCrossMeServer) GetPuzzleById(ctx context.Context, req *GetPuzzleByIdArgs) (*GetPuzzleResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method GetPuzzleById not implemented")
}

func RegisterCrossMeServer(s *grpc.Server, srv CrossMeServer) {
	s.RegisterService(&_CrossMe_serviceDesc, srv)
}

func _CrossMe_GetPuzzleById_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetPuzzleByIdArgs)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(CrossMeServer).GetPuzzleById(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/crossme.CrossMe/GetPuzzleById",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CrossMeServer).GetPuzzleById(ctx, req.(*GetPuzzleByIdArgs))
	}
	return interceptor(ctx, in, info, handler)
}

var _CrossMe_serviceDesc = grpc.ServiceDesc{
	ServiceName: "crossme.CrossMe",
	HandlerType: (*CrossMeServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "GetPuzzleById",
			Handler:    _CrossMe_GetPuzzleById_Handler,
		},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "crossme.proto",
}
