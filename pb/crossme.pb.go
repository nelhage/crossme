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

type GetPuzzleIndexArgs struct {
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *GetPuzzleIndexArgs) Reset()         { *m = GetPuzzleIndexArgs{} }
func (m *GetPuzzleIndexArgs) String() string { return proto.CompactTextString(m) }
func (*GetPuzzleIndexArgs) ProtoMessage()    {}
func (*GetPuzzleIndexArgs) Descriptor() ([]byte, []int) {
	return fileDescriptor_cc86cf064ca37a06, []int{0}
}

func (m *GetPuzzleIndexArgs) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_GetPuzzleIndexArgs.Unmarshal(m, b)
}
func (m *GetPuzzleIndexArgs) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_GetPuzzleIndexArgs.Marshal(b, m, deterministic)
}
func (m *GetPuzzleIndexArgs) XXX_Merge(src proto.Message) {
	xxx_messageInfo_GetPuzzleIndexArgs.Merge(m, src)
}
func (m *GetPuzzleIndexArgs) XXX_Size() int {
	return xxx_messageInfo_GetPuzzleIndexArgs.Size(m)
}
func (m *GetPuzzleIndexArgs) XXX_DiscardUnknown() {
	xxx_messageInfo_GetPuzzleIndexArgs.DiscardUnknown(m)
}

var xxx_messageInfo_GetPuzzleIndexArgs proto.InternalMessageInfo

type GetPuzzleIndexResponse struct {
	Puzzles              []*PuzzleIndex `protobuf:"bytes,1,rep,name=puzzles,proto3" json:"puzzles,omitempty"`
	XXX_NoUnkeyedLiteral struct{}       `json:"-"`
	XXX_unrecognized     []byte         `json:"-"`
	XXX_sizecache        int32          `json:"-"`
}

func (m *GetPuzzleIndexResponse) Reset()         { *m = GetPuzzleIndexResponse{} }
func (m *GetPuzzleIndexResponse) String() string { return proto.CompactTextString(m) }
func (*GetPuzzleIndexResponse) ProtoMessage()    {}
func (*GetPuzzleIndexResponse) Descriptor() ([]byte, []int) {
	return fileDescriptor_cc86cf064ca37a06, []int{1}
}

func (m *GetPuzzleIndexResponse) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_GetPuzzleIndexResponse.Unmarshal(m, b)
}
func (m *GetPuzzleIndexResponse) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_GetPuzzleIndexResponse.Marshal(b, m, deterministic)
}
func (m *GetPuzzleIndexResponse) XXX_Merge(src proto.Message) {
	xxx_messageInfo_GetPuzzleIndexResponse.Merge(m, src)
}
func (m *GetPuzzleIndexResponse) XXX_Size() int {
	return xxx_messageInfo_GetPuzzleIndexResponse.Size(m)
}
func (m *GetPuzzleIndexResponse) XXX_DiscardUnknown() {
	xxx_messageInfo_GetPuzzleIndexResponse.DiscardUnknown(m)
}

var xxx_messageInfo_GetPuzzleIndexResponse proto.InternalMessageInfo

func (m *GetPuzzleIndexResponse) GetPuzzles() []*PuzzleIndex {
	if m != nil {
		return m.Puzzles
	}
	return nil
}

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
	return fileDescriptor_cc86cf064ca37a06, []int{2}
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
	return fileDescriptor_cc86cf064ca37a06, []int{3}
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

type NewGameArgs struct {
	PuzzleId             string   `protobuf:"bytes,1,opt,name=puzzle_id,json=puzzleId,proto3" json:"puzzle_id,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *NewGameArgs) Reset()         { *m = NewGameArgs{} }
func (m *NewGameArgs) String() string { return proto.CompactTextString(m) }
func (*NewGameArgs) ProtoMessage()    {}
func (*NewGameArgs) Descriptor() ([]byte, []int) {
	return fileDescriptor_cc86cf064ca37a06, []int{4}
}

func (m *NewGameArgs) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_NewGameArgs.Unmarshal(m, b)
}
func (m *NewGameArgs) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_NewGameArgs.Marshal(b, m, deterministic)
}
func (m *NewGameArgs) XXX_Merge(src proto.Message) {
	xxx_messageInfo_NewGameArgs.Merge(m, src)
}
func (m *NewGameArgs) XXX_Size() int {
	return xxx_messageInfo_NewGameArgs.Size(m)
}
func (m *NewGameArgs) XXX_DiscardUnknown() {
	xxx_messageInfo_NewGameArgs.DiscardUnknown(m)
}

var xxx_messageInfo_NewGameArgs proto.InternalMessageInfo

func (m *NewGameArgs) GetPuzzleId() string {
	if m != nil {
		return m.PuzzleId
	}
	return ""
}

type NewGameResponse struct {
	Game                 *Game    `protobuf:"bytes,1,opt,name=game,proto3" json:"game,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *NewGameResponse) Reset()         { *m = NewGameResponse{} }
func (m *NewGameResponse) String() string { return proto.CompactTextString(m) }
func (*NewGameResponse) ProtoMessage()    {}
func (*NewGameResponse) Descriptor() ([]byte, []int) {
	return fileDescriptor_cc86cf064ca37a06, []int{5}
}

func (m *NewGameResponse) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_NewGameResponse.Unmarshal(m, b)
}
func (m *NewGameResponse) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_NewGameResponse.Marshal(b, m, deterministic)
}
func (m *NewGameResponse) XXX_Merge(src proto.Message) {
	xxx_messageInfo_NewGameResponse.Merge(m, src)
}
func (m *NewGameResponse) XXX_Size() int {
	return xxx_messageInfo_NewGameResponse.Size(m)
}
func (m *NewGameResponse) XXX_DiscardUnknown() {
	xxx_messageInfo_NewGameResponse.DiscardUnknown(m)
}

var xxx_messageInfo_NewGameResponse proto.InternalMessageInfo

func (m *NewGameResponse) GetGame() *Game {
	if m != nil {
		return m.Game
	}
	return nil
}

type GetGameByIdArgs struct {
	Id                   string   `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *GetGameByIdArgs) Reset()         { *m = GetGameByIdArgs{} }
func (m *GetGameByIdArgs) String() string { return proto.CompactTextString(m) }
func (*GetGameByIdArgs) ProtoMessage()    {}
func (*GetGameByIdArgs) Descriptor() ([]byte, []int) {
	return fileDescriptor_cc86cf064ca37a06, []int{6}
}

func (m *GetGameByIdArgs) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_GetGameByIdArgs.Unmarshal(m, b)
}
func (m *GetGameByIdArgs) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_GetGameByIdArgs.Marshal(b, m, deterministic)
}
func (m *GetGameByIdArgs) XXX_Merge(src proto.Message) {
	xxx_messageInfo_GetGameByIdArgs.Merge(m, src)
}
func (m *GetGameByIdArgs) XXX_Size() int {
	return xxx_messageInfo_GetGameByIdArgs.Size(m)
}
func (m *GetGameByIdArgs) XXX_DiscardUnknown() {
	xxx_messageInfo_GetGameByIdArgs.DiscardUnknown(m)
}

var xxx_messageInfo_GetGameByIdArgs proto.InternalMessageInfo

func (m *GetGameByIdArgs) GetId() string {
	if m != nil {
		return m.Id
	}
	return ""
}

type GetGameResponse struct {
	Game                 *Game    `protobuf:"bytes,1,opt,name=game,proto3" json:"game,omitempty"`
	Puzzle               *Puzzle  `protobuf:"bytes,2,opt,name=puzzle,proto3" json:"puzzle,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *GetGameResponse) Reset()         { *m = GetGameResponse{} }
func (m *GetGameResponse) String() string { return proto.CompactTextString(m) }
func (*GetGameResponse) ProtoMessage()    {}
func (*GetGameResponse) Descriptor() ([]byte, []int) {
	return fileDescriptor_cc86cf064ca37a06, []int{7}
}

func (m *GetGameResponse) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_GetGameResponse.Unmarshal(m, b)
}
func (m *GetGameResponse) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_GetGameResponse.Marshal(b, m, deterministic)
}
func (m *GetGameResponse) XXX_Merge(src proto.Message) {
	xxx_messageInfo_GetGameResponse.Merge(m, src)
}
func (m *GetGameResponse) XXX_Size() int {
	return xxx_messageInfo_GetGameResponse.Size(m)
}
func (m *GetGameResponse) XXX_DiscardUnknown() {
	xxx_messageInfo_GetGameResponse.DiscardUnknown(m)
}

var xxx_messageInfo_GetGameResponse proto.InternalMessageInfo

func (m *GetGameResponse) GetGame() *Game {
	if m != nil {
		return m.Game
	}
	return nil
}

func (m *GetGameResponse) GetPuzzle() *Puzzle {
	if m != nil {
		return m.Puzzle
	}
	return nil
}

type UploadPuzzleArgs struct {
	Filename             string   `protobuf:"bytes,1,opt,name=filename,proto3" json:"filename,omitempty"`
	Data                 []byte   `protobuf:"bytes,2,opt,name=data,proto3" json:"data,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *UploadPuzzleArgs) Reset()         { *m = UploadPuzzleArgs{} }
func (m *UploadPuzzleArgs) String() string { return proto.CompactTextString(m) }
func (*UploadPuzzleArgs) ProtoMessage()    {}
func (*UploadPuzzleArgs) Descriptor() ([]byte, []int) {
	return fileDescriptor_cc86cf064ca37a06, []int{8}
}

func (m *UploadPuzzleArgs) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_UploadPuzzleArgs.Unmarshal(m, b)
}
func (m *UploadPuzzleArgs) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_UploadPuzzleArgs.Marshal(b, m, deterministic)
}
func (m *UploadPuzzleArgs) XXX_Merge(src proto.Message) {
	xxx_messageInfo_UploadPuzzleArgs.Merge(m, src)
}
func (m *UploadPuzzleArgs) XXX_Size() int {
	return xxx_messageInfo_UploadPuzzleArgs.Size(m)
}
func (m *UploadPuzzleArgs) XXX_DiscardUnknown() {
	xxx_messageInfo_UploadPuzzleArgs.DiscardUnknown(m)
}

var xxx_messageInfo_UploadPuzzleArgs proto.InternalMessageInfo

func (m *UploadPuzzleArgs) GetFilename() string {
	if m != nil {
		return m.Filename
	}
	return ""
}

func (m *UploadPuzzleArgs) GetData() []byte {
	if m != nil {
		return m.Data
	}
	return nil
}

type UploadPuzzleResponse struct {
	Puzzle               *Puzzle  `protobuf:"bytes,1,opt,name=puzzle,proto3" json:"puzzle,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *UploadPuzzleResponse) Reset()         { *m = UploadPuzzleResponse{} }
func (m *UploadPuzzleResponse) String() string { return proto.CompactTextString(m) }
func (*UploadPuzzleResponse) ProtoMessage()    {}
func (*UploadPuzzleResponse) Descriptor() ([]byte, []int) {
	return fileDescriptor_cc86cf064ca37a06, []int{9}
}

func (m *UploadPuzzleResponse) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_UploadPuzzleResponse.Unmarshal(m, b)
}
func (m *UploadPuzzleResponse) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_UploadPuzzleResponse.Marshal(b, m, deterministic)
}
func (m *UploadPuzzleResponse) XXX_Merge(src proto.Message) {
	xxx_messageInfo_UploadPuzzleResponse.Merge(m, src)
}
func (m *UploadPuzzleResponse) XXX_Size() int {
	return xxx_messageInfo_UploadPuzzleResponse.Size(m)
}
func (m *UploadPuzzleResponse) XXX_DiscardUnknown() {
	xxx_messageInfo_UploadPuzzleResponse.DiscardUnknown(m)
}

var xxx_messageInfo_UploadPuzzleResponse proto.InternalMessageInfo

func (m *UploadPuzzleResponse) GetPuzzle() *Puzzle {
	if m != nil {
		return m.Puzzle
	}
	return nil
}

type SubscribeArgs struct {
	GameId               string   `protobuf:"bytes,1,opt,name=game_id,json=gameId,proto3" json:"game_id,omitempty"`
	NodeId               string   `protobuf:"bytes,2,opt,name=node_id,json=nodeId,proto3" json:"node_id,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *SubscribeArgs) Reset()         { *m = SubscribeArgs{} }
func (m *SubscribeArgs) String() string { return proto.CompactTextString(m) }
func (*SubscribeArgs) ProtoMessage()    {}
func (*SubscribeArgs) Descriptor() ([]byte, []int) {
	return fileDescriptor_cc86cf064ca37a06, []int{10}
}

func (m *SubscribeArgs) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_SubscribeArgs.Unmarshal(m, b)
}
func (m *SubscribeArgs) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_SubscribeArgs.Marshal(b, m, deterministic)
}
func (m *SubscribeArgs) XXX_Merge(src proto.Message) {
	xxx_messageInfo_SubscribeArgs.Merge(m, src)
}
func (m *SubscribeArgs) XXX_Size() int {
	return xxx_messageInfo_SubscribeArgs.Size(m)
}
func (m *SubscribeArgs) XXX_DiscardUnknown() {
	xxx_messageInfo_SubscribeArgs.DiscardUnknown(m)
}

var xxx_messageInfo_SubscribeArgs proto.InternalMessageInfo

func (m *SubscribeArgs) GetGameId() string {
	if m != nil {
		return m.GameId
	}
	return ""
}

func (m *SubscribeArgs) GetNodeId() string {
	if m != nil {
		return m.NodeId
	}
	return ""
}

type SubscribeEvent struct {
	Fill                 *Fill    `protobuf:"bytes,1,opt,name=fill,proto3" json:"fill,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *SubscribeEvent) Reset()         { *m = SubscribeEvent{} }
func (m *SubscribeEvent) String() string { return proto.CompactTextString(m) }
func (*SubscribeEvent) ProtoMessage()    {}
func (*SubscribeEvent) Descriptor() ([]byte, []int) {
	return fileDescriptor_cc86cf064ca37a06, []int{11}
}

func (m *SubscribeEvent) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_SubscribeEvent.Unmarshal(m, b)
}
func (m *SubscribeEvent) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_SubscribeEvent.Marshal(b, m, deterministic)
}
func (m *SubscribeEvent) XXX_Merge(src proto.Message) {
	xxx_messageInfo_SubscribeEvent.Merge(m, src)
}
func (m *SubscribeEvent) XXX_Size() int {
	return xxx_messageInfo_SubscribeEvent.Size(m)
}
func (m *SubscribeEvent) XXX_DiscardUnknown() {
	xxx_messageInfo_SubscribeEvent.DiscardUnknown(m)
}

var xxx_messageInfo_SubscribeEvent proto.InternalMessageInfo

func (m *SubscribeEvent) GetFill() *Fill {
	if m != nil {
		return m.Fill
	}
	return nil
}

type UpdateFillArgs struct {
	GameId               string   `protobuf:"bytes,1,opt,name=game_id,json=gameId,proto3" json:"game_id,omitempty"`
	NodeId               string   `protobuf:"bytes,2,opt,name=node_id,json=nodeId,proto3" json:"node_id,omitempty"`
	Fill                 *Fill    `protobuf:"bytes,3,opt,name=fill,proto3" json:"fill,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *UpdateFillArgs) Reset()         { *m = UpdateFillArgs{} }
func (m *UpdateFillArgs) String() string { return proto.CompactTextString(m) }
func (*UpdateFillArgs) ProtoMessage()    {}
func (*UpdateFillArgs) Descriptor() ([]byte, []int) {
	return fileDescriptor_cc86cf064ca37a06, []int{12}
}

func (m *UpdateFillArgs) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_UpdateFillArgs.Unmarshal(m, b)
}
func (m *UpdateFillArgs) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_UpdateFillArgs.Marshal(b, m, deterministic)
}
func (m *UpdateFillArgs) XXX_Merge(src proto.Message) {
	xxx_messageInfo_UpdateFillArgs.Merge(m, src)
}
func (m *UpdateFillArgs) XXX_Size() int {
	return xxx_messageInfo_UpdateFillArgs.Size(m)
}
func (m *UpdateFillArgs) XXX_DiscardUnknown() {
	xxx_messageInfo_UpdateFillArgs.DiscardUnknown(m)
}

var xxx_messageInfo_UpdateFillArgs proto.InternalMessageInfo

func (m *UpdateFillArgs) GetGameId() string {
	if m != nil {
		return m.GameId
	}
	return ""
}

func (m *UpdateFillArgs) GetNodeId() string {
	if m != nil {
		return m.NodeId
	}
	return ""
}

func (m *UpdateFillArgs) GetFill() *Fill {
	if m != nil {
		return m.Fill
	}
	return nil
}

type UpdateFillResponse struct {
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *UpdateFillResponse) Reset()         { *m = UpdateFillResponse{} }
func (m *UpdateFillResponse) String() string { return proto.CompactTextString(m) }
func (*UpdateFillResponse) ProtoMessage()    {}
func (*UpdateFillResponse) Descriptor() ([]byte, []int) {
	return fileDescriptor_cc86cf064ca37a06, []int{13}
}

func (m *UpdateFillResponse) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_UpdateFillResponse.Unmarshal(m, b)
}
func (m *UpdateFillResponse) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_UpdateFillResponse.Marshal(b, m, deterministic)
}
func (m *UpdateFillResponse) XXX_Merge(src proto.Message) {
	xxx_messageInfo_UpdateFillResponse.Merge(m, src)
}
func (m *UpdateFillResponse) XXX_Size() int {
	return xxx_messageInfo_UpdateFillResponse.Size(m)
}
func (m *UpdateFillResponse) XXX_DiscardUnknown() {
	xxx_messageInfo_UpdateFillResponse.DiscardUnknown(m)
}

var xxx_messageInfo_UpdateFillResponse proto.InternalMessageInfo

func init() {
	proto.RegisterType((*GetPuzzleIndexArgs)(nil), "crossme.GetPuzzleIndexArgs")
	proto.RegisterType((*GetPuzzleIndexResponse)(nil), "crossme.GetPuzzleIndexResponse")
	proto.RegisterType((*GetPuzzleByIdArgs)(nil), "crossme.GetPuzzleByIdArgs")
	proto.RegisterType((*GetPuzzleResponse)(nil), "crossme.GetPuzzleResponse")
	proto.RegisterType((*NewGameArgs)(nil), "crossme.NewGameArgs")
	proto.RegisterType((*NewGameResponse)(nil), "crossme.NewGameResponse")
	proto.RegisterType((*GetGameByIdArgs)(nil), "crossme.GetGameByIdArgs")
	proto.RegisterType((*GetGameResponse)(nil), "crossme.GetGameResponse")
	proto.RegisterType((*UploadPuzzleArgs)(nil), "crossme.UploadPuzzleArgs")
	proto.RegisterType((*UploadPuzzleResponse)(nil), "crossme.UploadPuzzleResponse")
	proto.RegisterType((*SubscribeArgs)(nil), "crossme.SubscribeArgs")
	proto.RegisterType((*SubscribeEvent)(nil), "crossme.SubscribeEvent")
	proto.RegisterType((*UpdateFillArgs)(nil), "crossme.UpdateFillArgs")
	proto.RegisterType((*UpdateFillResponse)(nil), "crossme.UpdateFillResponse")
}

func init() { proto.RegisterFile("crossme.proto", fileDescriptor_cc86cf064ca37a06) }

var fileDescriptor_cc86cf064ca37a06 = []byte{
	// 510 bytes of a gzipped FileDescriptorProto
	0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xff, 0x9c, 0x54, 0x4d, 0x6f, 0xd3, 0x40,
	0x10, 0x55, 0x92, 0x2a, 0x6e, 0x26, 0x5f, 0xb0, 0xb2, 0x9a, 0xb0, 0x11, 0xa2, 0x5d, 0x0e, 0x54,
	0x1c, 0x52, 0x94, 0x72, 0x41, 0x42, 0xa0, 0x04, 0x41, 0xea, 0x03, 0x15, 0x32, 0xea, 0x05, 0x09,
	0x21, 0x27, 0xbb, 0xad, 0x2c, 0xb9, 0xb6, 0x65, 0xbb, 0x7c, 0xf4, 0x47, 0xf3, 0x1b, 0xd0, 0xae,
	0xbd, 0xe3, 0x75, 0x9c, 0x20, 0xa5, 0x37, 0xef, 0xbc, 0xe7, 0xf7, 0x3c, 0xb3, 0x6f, 0x0c, 0xfd,
	0x75, 0x12, 0xa5, 0xe9, 0xad, 0x98, 0xc6, 0x49, 0x94, 0x45, 0xc4, 0x2a, 0x8e, 0xb4, 0x17, 0xdf,
	0xdd, 0xdf, 0x07, 0x45, 0x99, 0xc2, 0xb5, 0x1f, 0x04, 0xfa, 0xf9, 0xc6, 0xd3, 0x74, 0x66, 0x03,
	0x59, 0x8a, 0xec, 0x8b, 0xa2, 0x3a, 0x21, 0x17, 0xbf, 0xe7, 0xc9, 0x4d, 0xca, 0x2e, 0xe0, 0xa8,
	0x5a, 0x75, 0x45, 0x1a, 0x47, 0x61, 0x2a, 0xc8, 0x14, 0xac, 0x5c, 0x37, 0x1d, 0x37, 0x8e, 0x5b,
	0xa7, 0xdd, 0x99, 0x3d, 0xd5, 0xfe, 0x26, 0x5d, 0x93, 0xd8, 0x73, 0x78, 0x8c, 0x4a, 0x8b, 0x3f,
	0x0e, 0x97, 0xf2, 0x64, 0x00, 0x4d, 0x9f, 0x8f, 0x1b, 0xc7, 0x8d, 0xd3, 0x8e, 0xdb, 0xf4, 0x39,
	0x7b, 0x6b, 0x90, 0xd0, 0xe9, 0x05, 0xb4, 0x73, 0x11, 0x45, 0xec, 0xce, 0x86, 0x1b, 0x46, 0x6e,
	0x01, 0xb3, 0x97, 0xd0, 0xbd, 0x14, 0xbf, 0x96, 0xde, 0xad, 0x50, 0xe2, 0x13, 0xe8, 0xe4, 0xc0,
	0x0f, 0xf4, 0x38, 0xcc, 0x0b, 0x0e, 0x67, 0xaf, 0x61, 0x58, 0x70, 0xd1, 0xe7, 0x04, 0x0e, 0xe4,
	0x3c, 0x0a, 0x97, 0x3e, 0xba, 0x28, 0x92, 0x82, 0xd8, 0x09, 0x0c, 0x97, 0x22, 0x93, 0x85, 0x9d,
	0x2d, 0x7c, 0x47, 0xca, 0x1e, 0xc2, 0x46, 0x8f, 0xcd, 0xff, 0xf7, 0xb8, 0x80, 0x47, 0x57, 0x71,
	0x10, 0x79, 0x3c, 0xaf, 0xab, 0x4f, 0xa0, 0x70, 0x78, 0xed, 0x07, 0x22, 0xd4, 0x1e, 0x1d, 0x17,
	0xcf, 0x84, 0xc0, 0x01, 0xf7, 0x32, 0x4f, 0xc9, 0xf6, 0x5c, 0xf5, 0xcc, 0xde, 0x83, 0x6d, 0x6a,
	0xec, 0x3f, 0xe8, 0x39, 0xf4, 0xbf, 0xde, 0xad, 0xd2, 0x75, 0xe2, 0xaf, 0xf2, 0x2f, 0x18, 0x81,
	0x25, 0xdb, 0x28, 0x07, 0xdd, 0x96, 0x47, 0x87, 0x4b, 0x20, 0x8c, 0xb8, 0x02, 0x9a, 0x39, 0x20,
	0x8f, 0x0e, 0x67, 0xe7, 0x30, 0x40, 0x89, 0x8f, 0x3f, 0x45, 0x98, 0xc9, 0x29, 0xc9, 0x68, 0xd6,
	0xa6, 0xf4, 0xc9, 0x0f, 0x02, 0x57, 0x41, 0x4c, 0xc0, 0xe0, 0x2a, 0xe6, 0x5e, 0x26, 0x64, 0xed,
	0x61, 0xc6, 0x68, 0xd3, 0xda, 0x6d, 0x63, 0x03, 0x29, 0x6d, 0xf4, 0x74, 0x66, 0x7f, 0x5b, 0x60,
	0x7d, 0x90, 0xe4, 0xcf, 0x82, 0x5c, 0xc2, 0xa0, 0xba, 0x16, 0x64, 0x52, 0xde, 0x6a, 0x6d, 0x8b,
	0xe8, 0xb3, 0x1d, 0x20, 0x4e, 0x7e, 0x09, 0xfd, 0xca, 0x72, 0x10, 0x5a, 0x7f, 0x43, 0x27, 0x8e,
	0x6e, 0xc1, 0x50, 0xe8, 0x0d, 0x58, 0x45, 0xac, 0x49, 0xb9, 0x8f, 0xc6, 0x52, 0xd0, 0xf1, 0x66,
	0x15, 0x5f, 0x9d, 0x43, 0xd7, 0xc8, 0x36, 0x19, 0x9b, 0x2e, 0x66, 0xe2, 0x69, 0x0d, 0x41, 0x89,
	0x0b, 0xe8, 0x99, 0xc1, 0x22, 0x4f, 0x90, 0xb9, 0x99, 0x59, 0xfa, 0x74, 0x2b, 0x84, 0x4a, 0x0b,
	0x80, 0xf2, 0x0a, 0xc8, 0xc8, 0x20, 0x9b, 0xd7, 0x4f, 0x27, 0x5b, 0x00, 0xd4, 0x78, 0x07, 0x1d,
	0x8c, 0x18, 0x39, 0x42, 0x66, 0x25, 0xb9, 0x74, 0x54, 0xaf, 0xab, 0x38, 0xbe, 0x6a, 0x2c, 0xec,
	0x6f, 0x44, 0x63, 0x5e, 0x1c, 0x9f, 0xa5, 0xc9, 0xfa, 0x2c, 0x5e, 0xad, 0xda, 0xea, 0x77, 0x79,
	0xfe, 0x2f, 0x00, 0x00, 0xff, 0xff, 0xfc, 0x39, 0x75, 0xfa, 0x6e, 0x05, 0x00, 0x00,
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
	GetPuzzleIndex(ctx context.Context, in *GetPuzzleIndexArgs, opts ...grpc.CallOption) (*GetPuzzleIndexResponse, error)
	GetPuzzleById(ctx context.Context, in *GetPuzzleByIdArgs, opts ...grpc.CallOption) (*GetPuzzleResponse, error)
	NewGame(ctx context.Context, in *NewGameArgs, opts ...grpc.CallOption) (*NewGameResponse, error)
	GetGameById(ctx context.Context, in *GetGameByIdArgs, opts ...grpc.CallOption) (*GetGameResponse, error)
	UploadPuzzle(ctx context.Context, in *UploadPuzzleArgs, opts ...grpc.CallOption) (*UploadPuzzleResponse, error)
	UpdateFill(ctx context.Context, in *UpdateFillArgs, opts ...grpc.CallOption) (*UpdateFillResponse, error)
	Subscribe(ctx context.Context, in *SubscribeArgs, opts ...grpc.CallOption) (CrossMe_SubscribeClient, error)
}

type crossMeClient struct {
	cc *grpc.ClientConn
}

func NewCrossMeClient(cc *grpc.ClientConn) CrossMeClient {
	return &crossMeClient{cc}
}

func (c *crossMeClient) GetPuzzleIndex(ctx context.Context, in *GetPuzzleIndexArgs, opts ...grpc.CallOption) (*GetPuzzleIndexResponse, error) {
	out := new(GetPuzzleIndexResponse)
	err := c.cc.Invoke(ctx, "/crossme.CrossMe/GetPuzzleIndex", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *crossMeClient) GetPuzzleById(ctx context.Context, in *GetPuzzleByIdArgs, opts ...grpc.CallOption) (*GetPuzzleResponse, error) {
	out := new(GetPuzzleResponse)
	err := c.cc.Invoke(ctx, "/crossme.CrossMe/GetPuzzleById", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *crossMeClient) NewGame(ctx context.Context, in *NewGameArgs, opts ...grpc.CallOption) (*NewGameResponse, error) {
	out := new(NewGameResponse)
	err := c.cc.Invoke(ctx, "/crossme.CrossMe/NewGame", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *crossMeClient) GetGameById(ctx context.Context, in *GetGameByIdArgs, opts ...grpc.CallOption) (*GetGameResponse, error) {
	out := new(GetGameResponse)
	err := c.cc.Invoke(ctx, "/crossme.CrossMe/GetGameById", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *crossMeClient) UploadPuzzle(ctx context.Context, in *UploadPuzzleArgs, opts ...grpc.CallOption) (*UploadPuzzleResponse, error) {
	out := new(UploadPuzzleResponse)
	err := c.cc.Invoke(ctx, "/crossme.CrossMe/UploadPuzzle", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *crossMeClient) UpdateFill(ctx context.Context, in *UpdateFillArgs, opts ...grpc.CallOption) (*UpdateFillResponse, error) {
	out := new(UpdateFillResponse)
	err := c.cc.Invoke(ctx, "/crossme.CrossMe/UpdateFill", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *crossMeClient) Subscribe(ctx context.Context, in *SubscribeArgs, opts ...grpc.CallOption) (CrossMe_SubscribeClient, error) {
	stream, err := c.cc.NewStream(ctx, &_CrossMe_serviceDesc.Streams[0], "/crossme.CrossMe/Subscribe", opts...)
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

// CrossMeServer is the server API for CrossMe service.
type CrossMeServer interface {
	GetPuzzleIndex(context.Context, *GetPuzzleIndexArgs) (*GetPuzzleIndexResponse, error)
	GetPuzzleById(context.Context, *GetPuzzleByIdArgs) (*GetPuzzleResponse, error)
	NewGame(context.Context, *NewGameArgs) (*NewGameResponse, error)
	GetGameById(context.Context, *GetGameByIdArgs) (*GetGameResponse, error)
	UploadPuzzle(context.Context, *UploadPuzzleArgs) (*UploadPuzzleResponse, error)
	UpdateFill(context.Context, *UpdateFillArgs) (*UpdateFillResponse, error)
	Subscribe(*SubscribeArgs, CrossMe_SubscribeServer) error
}

// UnimplementedCrossMeServer can be embedded to have forward compatible implementations.
type UnimplementedCrossMeServer struct {
}

func (*UnimplementedCrossMeServer) GetPuzzleIndex(ctx context.Context, req *GetPuzzleIndexArgs) (*GetPuzzleIndexResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method GetPuzzleIndex not implemented")
}
func (*UnimplementedCrossMeServer) GetPuzzleById(ctx context.Context, req *GetPuzzleByIdArgs) (*GetPuzzleResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method GetPuzzleById not implemented")
}
func (*UnimplementedCrossMeServer) NewGame(ctx context.Context, req *NewGameArgs) (*NewGameResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method NewGame not implemented")
}
func (*UnimplementedCrossMeServer) GetGameById(ctx context.Context, req *GetGameByIdArgs) (*GetGameResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method GetGameById not implemented")
}
func (*UnimplementedCrossMeServer) UploadPuzzle(ctx context.Context, req *UploadPuzzleArgs) (*UploadPuzzleResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method UploadPuzzle not implemented")
}
func (*UnimplementedCrossMeServer) UpdateFill(ctx context.Context, req *UpdateFillArgs) (*UpdateFillResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method UpdateFill not implemented")
}
func (*UnimplementedCrossMeServer) Subscribe(req *SubscribeArgs, srv CrossMe_SubscribeServer) error {
	return status.Errorf(codes.Unimplemented, "method Subscribe not implemented")
}

func RegisterCrossMeServer(s *grpc.Server, srv CrossMeServer) {
	s.RegisterService(&_CrossMe_serviceDesc, srv)
}

func _CrossMe_GetPuzzleIndex_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetPuzzleIndexArgs)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(CrossMeServer).GetPuzzleIndex(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/crossme.CrossMe/GetPuzzleIndex",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CrossMeServer).GetPuzzleIndex(ctx, req.(*GetPuzzleIndexArgs))
	}
	return interceptor(ctx, in, info, handler)
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

func _CrossMe_NewGame_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(NewGameArgs)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(CrossMeServer).NewGame(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/crossme.CrossMe/NewGame",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CrossMeServer).NewGame(ctx, req.(*NewGameArgs))
	}
	return interceptor(ctx, in, info, handler)
}

func _CrossMe_GetGameById_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetGameByIdArgs)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(CrossMeServer).GetGameById(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/crossme.CrossMe/GetGameById",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CrossMeServer).GetGameById(ctx, req.(*GetGameByIdArgs))
	}
	return interceptor(ctx, in, info, handler)
}

func _CrossMe_UploadPuzzle_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(UploadPuzzleArgs)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(CrossMeServer).UploadPuzzle(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/crossme.CrossMe/UploadPuzzle",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CrossMeServer).UploadPuzzle(ctx, req.(*UploadPuzzleArgs))
	}
	return interceptor(ctx, in, info, handler)
}

func _CrossMe_UpdateFill_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(UpdateFillArgs)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(CrossMeServer).UpdateFill(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/crossme.CrossMe/UpdateFill",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(CrossMeServer).UpdateFill(ctx, req.(*UpdateFillArgs))
	}
	return interceptor(ctx, in, info, handler)
}

func _CrossMe_Subscribe_Handler(srv interface{}, stream grpc.ServerStream) error {
	m := new(SubscribeArgs)
	if err := stream.RecvMsg(m); err != nil {
		return err
	}
	return srv.(CrossMeServer).Subscribe(m, &crossMeSubscribeServer{stream})
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

var _CrossMe_serviceDesc = grpc.ServiceDesc{
	ServiceName: "crossme.CrossMe",
	HandlerType: (*CrossMeServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "GetPuzzleIndex",
			Handler:    _CrossMe_GetPuzzleIndex_Handler,
		},
		{
			MethodName: "GetPuzzleById",
			Handler:    _CrossMe_GetPuzzleById_Handler,
		},
		{
			MethodName: "NewGame",
			Handler:    _CrossMe_NewGame_Handler,
		},
		{
			MethodName: "GetGameById",
			Handler:    _CrossMe_GetGameById_Handler,
		},
		{
			MethodName: "UploadPuzzle",
			Handler:    _CrossMe_UploadPuzzle_Handler,
		},
		{
			MethodName: "UpdateFill",
			Handler:    _CrossMe_UpdateFill_Handler,
		},
	},
	Streams: []grpc.StreamDesc{
		{
			StreamName:    "Subscribe",
			Handler:       _CrossMe_Subscribe_Handler,
			ServerStreams: true,
		},
	},
	Metadata: "crossme.proto",
}
