// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.25.0
// 	protoc        v3.6.1
// source: crossme.proto

package pb

import (
	proto "github.com/golang/protobuf/proto"
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	reflect "reflect"
	sync "sync"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

// This is a compile-time assertion that a sufficiently up-to-date version
// of the legacy proto package is being used.
const _ = proto.ProtoPackageIsVersion4

type GetPuzzleIndexArgs struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *GetPuzzleIndexArgs) Reset() {
	*x = GetPuzzleIndexArgs{}
	if protoimpl.UnsafeEnabled {
		mi := &file_crossme_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *GetPuzzleIndexArgs) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetPuzzleIndexArgs) ProtoMessage() {}

func (x *GetPuzzleIndexArgs) ProtoReflect() protoreflect.Message {
	mi := &file_crossme_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetPuzzleIndexArgs.ProtoReflect.Descriptor instead.
func (*GetPuzzleIndexArgs) Descriptor() ([]byte, []int) {
	return file_crossme_proto_rawDescGZIP(), []int{0}
}

type GetPuzzleIndexResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Puzzles []*PuzzleIndex `protobuf:"bytes,1,rep,name=puzzles,proto3" json:"puzzles,omitempty"`
}

func (x *GetPuzzleIndexResponse) Reset() {
	*x = GetPuzzleIndexResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_crossme_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *GetPuzzleIndexResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetPuzzleIndexResponse) ProtoMessage() {}

func (x *GetPuzzleIndexResponse) ProtoReflect() protoreflect.Message {
	mi := &file_crossme_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetPuzzleIndexResponse.ProtoReflect.Descriptor instead.
func (*GetPuzzleIndexResponse) Descriptor() ([]byte, []int) {
	return file_crossme_proto_rawDescGZIP(), []int{1}
}

func (x *GetPuzzleIndexResponse) GetPuzzles() []*PuzzleIndex {
	if x != nil {
		return x.Puzzles
	}
	return nil
}

type GetPuzzleByIdArgs struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Id string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
}

func (x *GetPuzzleByIdArgs) Reset() {
	*x = GetPuzzleByIdArgs{}
	if protoimpl.UnsafeEnabled {
		mi := &file_crossme_proto_msgTypes[2]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *GetPuzzleByIdArgs) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetPuzzleByIdArgs) ProtoMessage() {}

func (x *GetPuzzleByIdArgs) ProtoReflect() protoreflect.Message {
	mi := &file_crossme_proto_msgTypes[2]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetPuzzleByIdArgs.ProtoReflect.Descriptor instead.
func (*GetPuzzleByIdArgs) Descriptor() ([]byte, []int) {
	return file_crossme_proto_rawDescGZIP(), []int{2}
}

func (x *GetPuzzleByIdArgs) GetId() string {
	if x != nil {
		return x.Id
	}
	return ""
}

type GetPuzzleResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Puzzle *Puzzle `protobuf:"bytes,1,opt,name=puzzle,proto3" json:"puzzle,omitempty"`
}

func (x *GetPuzzleResponse) Reset() {
	*x = GetPuzzleResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_crossme_proto_msgTypes[3]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *GetPuzzleResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetPuzzleResponse) ProtoMessage() {}

func (x *GetPuzzleResponse) ProtoReflect() protoreflect.Message {
	mi := &file_crossme_proto_msgTypes[3]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetPuzzleResponse.ProtoReflect.Descriptor instead.
func (*GetPuzzleResponse) Descriptor() ([]byte, []int) {
	return file_crossme_proto_rawDescGZIP(), []int{3}
}

func (x *GetPuzzleResponse) GetPuzzle() *Puzzle {
	if x != nil {
		return x.Puzzle
	}
	return nil
}

type NewGameArgs struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	PuzzleId string `protobuf:"bytes,1,opt,name=puzzle_id,json=puzzleId,proto3" json:"puzzle_id,omitempty"`
}

func (x *NewGameArgs) Reset() {
	*x = NewGameArgs{}
	if protoimpl.UnsafeEnabled {
		mi := &file_crossme_proto_msgTypes[4]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *NewGameArgs) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*NewGameArgs) ProtoMessage() {}

func (x *NewGameArgs) ProtoReflect() protoreflect.Message {
	mi := &file_crossme_proto_msgTypes[4]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use NewGameArgs.ProtoReflect.Descriptor instead.
func (*NewGameArgs) Descriptor() ([]byte, []int) {
	return file_crossme_proto_rawDescGZIP(), []int{4}
}

func (x *NewGameArgs) GetPuzzleId() string {
	if x != nil {
		return x.PuzzleId
	}
	return ""
}

type NewGameResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Game *Game `protobuf:"bytes,1,opt,name=game,proto3" json:"game,omitempty"`
}

func (x *NewGameResponse) Reset() {
	*x = NewGameResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_crossme_proto_msgTypes[5]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *NewGameResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*NewGameResponse) ProtoMessage() {}

func (x *NewGameResponse) ProtoReflect() protoreflect.Message {
	mi := &file_crossme_proto_msgTypes[5]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use NewGameResponse.ProtoReflect.Descriptor instead.
func (*NewGameResponse) Descriptor() ([]byte, []int) {
	return file_crossme_proto_rawDescGZIP(), []int{5}
}

func (x *NewGameResponse) GetGame() *Game {
	if x != nil {
		return x.Game
	}
	return nil
}

type GetGameByIdArgs struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Id string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
}

func (x *GetGameByIdArgs) Reset() {
	*x = GetGameByIdArgs{}
	if protoimpl.UnsafeEnabled {
		mi := &file_crossme_proto_msgTypes[6]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *GetGameByIdArgs) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetGameByIdArgs) ProtoMessage() {}

func (x *GetGameByIdArgs) ProtoReflect() protoreflect.Message {
	mi := &file_crossme_proto_msgTypes[6]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetGameByIdArgs.ProtoReflect.Descriptor instead.
func (*GetGameByIdArgs) Descriptor() ([]byte, []int) {
	return file_crossme_proto_rawDescGZIP(), []int{6}
}

func (x *GetGameByIdArgs) GetId() string {
	if x != nil {
		return x.Id
	}
	return ""
}

type GetGameResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Game   *Game   `protobuf:"bytes,1,opt,name=game,proto3" json:"game,omitempty"`
	Puzzle *Puzzle `protobuf:"bytes,2,opt,name=puzzle,proto3" json:"puzzle,omitempty"`
}

func (x *GetGameResponse) Reset() {
	*x = GetGameResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_crossme_proto_msgTypes[7]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *GetGameResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetGameResponse) ProtoMessage() {}

func (x *GetGameResponse) ProtoReflect() protoreflect.Message {
	mi := &file_crossme_proto_msgTypes[7]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetGameResponse.ProtoReflect.Descriptor instead.
func (*GetGameResponse) Descriptor() ([]byte, []int) {
	return file_crossme_proto_rawDescGZIP(), []int{7}
}

func (x *GetGameResponse) GetGame() *Game {
	if x != nil {
		return x.Game
	}
	return nil
}

func (x *GetGameResponse) GetPuzzle() *Puzzle {
	if x != nil {
		return x.Puzzle
	}
	return nil
}

type UploadPuzzleArgs struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Filename string `protobuf:"bytes,1,opt,name=filename,proto3" json:"filename,omitempty"`
	Data     []byte `protobuf:"bytes,2,opt,name=data,proto3" json:"data,omitempty"`
}

func (x *UploadPuzzleArgs) Reset() {
	*x = UploadPuzzleArgs{}
	if protoimpl.UnsafeEnabled {
		mi := &file_crossme_proto_msgTypes[8]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *UploadPuzzleArgs) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*UploadPuzzleArgs) ProtoMessage() {}

func (x *UploadPuzzleArgs) ProtoReflect() protoreflect.Message {
	mi := &file_crossme_proto_msgTypes[8]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use UploadPuzzleArgs.ProtoReflect.Descriptor instead.
func (*UploadPuzzleArgs) Descriptor() ([]byte, []int) {
	return file_crossme_proto_rawDescGZIP(), []int{8}
}

func (x *UploadPuzzleArgs) GetFilename() string {
	if x != nil {
		return x.Filename
	}
	return ""
}

func (x *UploadPuzzleArgs) GetData() []byte {
	if x != nil {
		return x.Data
	}
	return nil
}

type UploadPuzzleResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Puzzle *Puzzle `protobuf:"bytes,1,opt,name=puzzle,proto3" json:"puzzle,omitempty"`
}

func (x *UploadPuzzleResponse) Reset() {
	*x = UploadPuzzleResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_crossme_proto_msgTypes[9]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *UploadPuzzleResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*UploadPuzzleResponse) ProtoMessage() {}

func (x *UploadPuzzleResponse) ProtoReflect() protoreflect.Message {
	mi := &file_crossme_proto_msgTypes[9]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use UploadPuzzleResponse.ProtoReflect.Descriptor instead.
func (*UploadPuzzleResponse) Descriptor() ([]byte, []int) {
	return file_crossme_proto_rawDescGZIP(), []int{9}
}

func (x *UploadPuzzleResponse) GetPuzzle() *Puzzle {
	if x != nil {
		return x.Puzzle
	}
	return nil
}

type SubscribeArgs struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	GameId string `protobuf:"bytes,1,opt,name=game_id,json=gameId,proto3" json:"game_id,omitempty"`
	NodeId string `protobuf:"bytes,2,opt,name=node_id,json=nodeId,proto3" json:"node_id,omitempty"`
}

func (x *SubscribeArgs) Reset() {
	*x = SubscribeArgs{}
	if protoimpl.UnsafeEnabled {
		mi := &file_crossme_proto_msgTypes[10]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *SubscribeArgs) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*SubscribeArgs) ProtoMessage() {}

func (x *SubscribeArgs) ProtoReflect() protoreflect.Message {
	mi := &file_crossme_proto_msgTypes[10]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use SubscribeArgs.ProtoReflect.Descriptor instead.
func (*SubscribeArgs) Descriptor() ([]byte, []int) {
	return file_crossme_proto_rawDescGZIP(), []int{10}
}

func (x *SubscribeArgs) GetGameId() string {
	if x != nil {
		return x.GameId
	}
	return ""
}

func (x *SubscribeArgs) GetNodeId() string {
	if x != nil {
		return x.NodeId
	}
	return ""
}

type SubscribeEvent struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Fill *Fill `protobuf:"bytes,1,opt,name=fill,proto3" json:"fill,omitempty"`
}

func (x *SubscribeEvent) Reset() {
	*x = SubscribeEvent{}
	if protoimpl.UnsafeEnabled {
		mi := &file_crossme_proto_msgTypes[11]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *SubscribeEvent) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*SubscribeEvent) ProtoMessage() {}

func (x *SubscribeEvent) ProtoReflect() protoreflect.Message {
	mi := &file_crossme_proto_msgTypes[11]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use SubscribeEvent.ProtoReflect.Descriptor instead.
func (*SubscribeEvent) Descriptor() ([]byte, []int) {
	return file_crossme_proto_rawDescGZIP(), []int{11}
}

func (x *SubscribeEvent) GetFill() *Fill {
	if x != nil {
		return x.Fill
	}
	return nil
}

type UpdateFillArgs struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	GameId string `protobuf:"bytes,1,opt,name=game_id,json=gameId,proto3" json:"game_id,omitempty"`
	NodeId string `protobuf:"bytes,2,opt,name=node_id,json=nodeId,proto3" json:"node_id,omitempty"`
	Fill   *Fill  `protobuf:"bytes,3,opt,name=fill,proto3" json:"fill,omitempty"`
}

func (x *UpdateFillArgs) Reset() {
	*x = UpdateFillArgs{}
	if protoimpl.UnsafeEnabled {
		mi := &file_crossme_proto_msgTypes[12]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *UpdateFillArgs) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*UpdateFillArgs) ProtoMessage() {}

func (x *UpdateFillArgs) ProtoReflect() protoreflect.Message {
	mi := &file_crossme_proto_msgTypes[12]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use UpdateFillArgs.ProtoReflect.Descriptor instead.
func (*UpdateFillArgs) Descriptor() ([]byte, []int) {
	return file_crossme_proto_rawDescGZIP(), []int{12}
}

func (x *UpdateFillArgs) GetGameId() string {
	if x != nil {
		return x.GameId
	}
	return ""
}

func (x *UpdateFillArgs) GetNodeId() string {
	if x != nil {
		return x.NodeId
	}
	return ""
}

func (x *UpdateFillArgs) GetFill() *Fill {
	if x != nil {
		return x.Fill
	}
	return nil
}

type UpdateFillResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *UpdateFillResponse) Reset() {
	*x = UpdateFillResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_crossme_proto_msgTypes[13]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *UpdateFillResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*UpdateFillResponse) ProtoMessage() {}

func (x *UpdateFillResponse) ProtoReflect() protoreflect.Message {
	mi := &file_crossme_proto_msgTypes[13]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use UpdateFillResponse.ProtoReflect.Descriptor instead.
func (*UpdateFillResponse) Descriptor() ([]byte, []int) {
	return file_crossme_proto_rawDescGZIP(), []int{13}
}

var File_crossme_proto protoreflect.FileDescriptor

var file_crossme_proto_rawDesc = []byte{
	0x0a, 0x0d, 0x63, 0x72, 0x6f, 0x73, 0x73, 0x6d, 0x65, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x12,
	0x07, 0x63, 0x72, 0x6f, 0x73, 0x73, 0x6d, 0x65, 0x1a, 0x0c, 0x70, 0x75, 0x7a, 0x7a, 0x6c, 0x65,
	0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x1a, 0x0a, 0x66, 0x69, 0x6c, 0x6c, 0x2e, 0x70, 0x72, 0x6f,
	0x74, 0x6f, 0x1a, 0x0a, 0x67, 0x61, 0x6d, 0x65, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x22, 0x14,
	0x0a, 0x12, 0x47, 0x65, 0x74, 0x50, 0x75, 0x7a, 0x7a, 0x6c, 0x65, 0x49, 0x6e, 0x64, 0x65, 0x78,
	0x41, 0x72, 0x67, 0x73, 0x22, 0x48, 0x0a, 0x16, 0x47, 0x65, 0x74, 0x50, 0x75, 0x7a, 0x7a, 0x6c,
	0x65, 0x49, 0x6e, 0x64, 0x65, 0x78, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x2e,
	0x0a, 0x07, 0x70, 0x75, 0x7a, 0x7a, 0x6c, 0x65, 0x73, 0x18, 0x01, 0x20, 0x03, 0x28, 0x0b, 0x32,
	0x14, 0x2e, 0x63, 0x72, 0x6f, 0x73, 0x73, 0x6d, 0x65, 0x2e, 0x50, 0x75, 0x7a, 0x7a, 0x6c, 0x65,
	0x49, 0x6e, 0x64, 0x65, 0x78, 0x52, 0x07, 0x70, 0x75, 0x7a, 0x7a, 0x6c, 0x65, 0x73, 0x22, 0x23,
	0x0a, 0x11, 0x47, 0x65, 0x74, 0x50, 0x75, 0x7a, 0x7a, 0x6c, 0x65, 0x42, 0x79, 0x49, 0x64, 0x41,
	0x72, 0x67, 0x73, 0x12, 0x0e, 0x0a, 0x02, 0x69, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52,
	0x02, 0x69, 0x64, 0x22, 0x3c, 0x0a, 0x11, 0x47, 0x65, 0x74, 0x50, 0x75, 0x7a, 0x7a, 0x6c, 0x65,
	0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x27, 0x0a, 0x06, 0x70, 0x75, 0x7a, 0x7a,
	0x6c, 0x65, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x0f, 0x2e, 0x63, 0x72, 0x6f, 0x73, 0x73,
	0x6d, 0x65, 0x2e, 0x50, 0x75, 0x7a, 0x7a, 0x6c, 0x65, 0x52, 0x06, 0x70, 0x75, 0x7a, 0x7a, 0x6c,
	0x65, 0x22, 0x2a, 0x0a, 0x0b, 0x4e, 0x65, 0x77, 0x47, 0x61, 0x6d, 0x65, 0x41, 0x72, 0x67, 0x73,
	0x12, 0x1b, 0x0a, 0x09, 0x70, 0x75, 0x7a, 0x7a, 0x6c, 0x65, 0x5f, 0x69, 0x64, 0x18, 0x01, 0x20,
	0x01, 0x28, 0x09, 0x52, 0x08, 0x70, 0x75, 0x7a, 0x7a, 0x6c, 0x65, 0x49, 0x64, 0x22, 0x34, 0x0a,
	0x0f, 0x4e, 0x65, 0x77, 0x47, 0x61, 0x6d, 0x65, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65,
	0x12, 0x21, 0x0a, 0x04, 0x67, 0x61, 0x6d, 0x65, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x0d,
	0x2e, 0x63, 0x72, 0x6f, 0x73, 0x73, 0x6d, 0x65, 0x2e, 0x47, 0x61, 0x6d, 0x65, 0x52, 0x04, 0x67,
	0x61, 0x6d, 0x65, 0x22, 0x21, 0x0a, 0x0f, 0x47, 0x65, 0x74, 0x47, 0x61, 0x6d, 0x65, 0x42, 0x79,
	0x49, 0x64, 0x41, 0x72, 0x67, 0x73, 0x12, 0x0e, 0x0a, 0x02, 0x69, 0x64, 0x18, 0x01, 0x20, 0x01,
	0x28, 0x09, 0x52, 0x02, 0x69, 0x64, 0x22, 0x5d, 0x0a, 0x0f, 0x47, 0x65, 0x74, 0x47, 0x61, 0x6d,
	0x65, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x21, 0x0a, 0x04, 0x67, 0x61, 0x6d,
	0x65, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x0d, 0x2e, 0x63, 0x72, 0x6f, 0x73, 0x73, 0x6d,
	0x65, 0x2e, 0x47, 0x61, 0x6d, 0x65, 0x52, 0x04, 0x67, 0x61, 0x6d, 0x65, 0x12, 0x27, 0x0a, 0x06,
	0x70, 0x75, 0x7a, 0x7a, 0x6c, 0x65, 0x18, 0x02, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x0f, 0x2e, 0x63,
	0x72, 0x6f, 0x73, 0x73, 0x6d, 0x65, 0x2e, 0x50, 0x75, 0x7a, 0x7a, 0x6c, 0x65, 0x52, 0x06, 0x70,
	0x75, 0x7a, 0x7a, 0x6c, 0x65, 0x22, 0x42, 0x0a, 0x10, 0x55, 0x70, 0x6c, 0x6f, 0x61, 0x64, 0x50,
	0x75, 0x7a, 0x7a, 0x6c, 0x65, 0x41, 0x72, 0x67, 0x73, 0x12, 0x1a, 0x0a, 0x08, 0x66, 0x69, 0x6c,
	0x65, 0x6e, 0x61, 0x6d, 0x65, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x08, 0x66, 0x69, 0x6c,
	0x65, 0x6e, 0x61, 0x6d, 0x65, 0x12, 0x12, 0x0a, 0x04, 0x64, 0x61, 0x74, 0x61, 0x18, 0x02, 0x20,
	0x01, 0x28, 0x0c, 0x52, 0x04, 0x64, 0x61, 0x74, 0x61, 0x22, 0x3f, 0x0a, 0x14, 0x55, 0x70, 0x6c,
	0x6f, 0x61, 0x64, 0x50, 0x75, 0x7a, 0x7a, 0x6c, 0x65, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73,
	0x65, 0x12, 0x27, 0x0a, 0x06, 0x70, 0x75, 0x7a, 0x7a, 0x6c, 0x65, 0x18, 0x01, 0x20, 0x01, 0x28,
	0x0b, 0x32, 0x0f, 0x2e, 0x63, 0x72, 0x6f, 0x73, 0x73, 0x6d, 0x65, 0x2e, 0x50, 0x75, 0x7a, 0x7a,
	0x6c, 0x65, 0x52, 0x06, 0x70, 0x75, 0x7a, 0x7a, 0x6c, 0x65, 0x22, 0x41, 0x0a, 0x0d, 0x53, 0x75,
	0x62, 0x73, 0x63, 0x72, 0x69, 0x62, 0x65, 0x41, 0x72, 0x67, 0x73, 0x12, 0x17, 0x0a, 0x07, 0x67,
	0x61, 0x6d, 0x65, 0x5f, 0x69, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x06, 0x67, 0x61,
	0x6d, 0x65, 0x49, 0x64, 0x12, 0x17, 0x0a, 0x07, 0x6e, 0x6f, 0x64, 0x65, 0x5f, 0x69, 0x64, 0x18,
	0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x06, 0x6e, 0x6f, 0x64, 0x65, 0x49, 0x64, 0x22, 0x33, 0x0a,
	0x0e, 0x53, 0x75, 0x62, 0x73, 0x63, 0x72, 0x69, 0x62, 0x65, 0x45, 0x76, 0x65, 0x6e, 0x74, 0x12,
	0x21, 0x0a, 0x04, 0x66, 0x69, 0x6c, 0x6c, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x0d, 0x2e,
	0x63, 0x72, 0x6f, 0x73, 0x73, 0x6d, 0x65, 0x2e, 0x46, 0x69, 0x6c, 0x6c, 0x52, 0x04, 0x66, 0x69,
	0x6c, 0x6c, 0x22, 0x65, 0x0a, 0x0e, 0x55, 0x70, 0x64, 0x61, 0x74, 0x65, 0x46, 0x69, 0x6c, 0x6c,
	0x41, 0x72, 0x67, 0x73, 0x12, 0x17, 0x0a, 0x07, 0x67, 0x61, 0x6d, 0x65, 0x5f, 0x69, 0x64, 0x18,
	0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x06, 0x67, 0x61, 0x6d, 0x65, 0x49, 0x64, 0x12, 0x17, 0x0a,
	0x07, 0x6e, 0x6f, 0x64, 0x65, 0x5f, 0x69, 0x64, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x06,
	0x6e, 0x6f, 0x64, 0x65, 0x49, 0x64, 0x12, 0x21, 0x0a, 0x04, 0x66, 0x69, 0x6c, 0x6c, 0x18, 0x03,
	0x20, 0x01, 0x28, 0x0b, 0x32, 0x0d, 0x2e, 0x63, 0x72, 0x6f, 0x73, 0x73, 0x6d, 0x65, 0x2e, 0x46,
	0x69, 0x6c, 0x6c, 0x52, 0x04, 0x66, 0x69, 0x6c, 0x6c, 0x22, 0x14, 0x0a, 0x12, 0x55, 0x70, 0x64,
	0x61, 0x74, 0x65, 0x46, 0x69, 0x6c, 0x6c, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x32,
	0xee, 0x03, 0x0a, 0x07, 0x43, 0x72, 0x6f, 0x73, 0x73, 0x4d, 0x65, 0x12, 0x4e, 0x0a, 0x0e, 0x47,
	0x65, 0x74, 0x50, 0x75, 0x7a, 0x7a, 0x6c, 0x65, 0x49, 0x6e, 0x64, 0x65, 0x78, 0x12, 0x1b, 0x2e,
	0x63, 0x72, 0x6f, 0x73, 0x73, 0x6d, 0x65, 0x2e, 0x47, 0x65, 0x74, 0x50, 0x75, 0x7a, 0x7a, 0x6c,
	0x65, 0x49, 0x6e, 0x64, 0x65, 0x78, 0x41, 0x72, 0x67, 0x73, 0x1a, 0x1f, 0x2e, 0x63, 0x72, 0x6f,
	0x73, 0x73, 0x6d, 0x65, 0x2e, 0x47, 0x65, 0x74, 0x50, 0x75, 0x7a, 0x7a, 0x6c, 0x65, 0x49, 0x6e,
	0x64, 0x65, 0x78, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x47, 0x0a, 0x0d, 0x47,
	0x65, 0x74, 0x50, 0x75, 0x7a, 0x7a, 0x6c, 0x65, 0x42, 0x79, 0x49, 0x64, 0x12, 0x1a, 0x2e, 0x63,
	0x72, 0x6f, 0x73, 0x73, 0x6d, 0x65, 0x2e, 0x47, 0x65, 0x74, 0x50, 0x75, 0x7a, 0x7a, 0x6c, 0x65,
	0x42, 0x79, 0x49, 0x64, 0x41, 0x72, 0x67, 0x73, 0x1a, 0x1a, 0x2e, 0x63, 0x72, 0x6f, 0x73, 0x73,
	0x6d, 0x65, 0x2e, 0x47, 0x65, 0x74, 0x50, 0x75, 0x7a, 0x7a, 0x6c, 0x65, 0x52, 0x65, 0x73, 0x70,
	0x6f, 0x6e, 0x73, 0x65, 0x12, 0x39, 0x0a, 0x07, 0x4e, 0x65, 0x77, 0x47, 0x61, 0x6d, 0x65, 0x12,
	0x14, 0x2e, 0x63, 0x72, 0x6f, 0x73, 0x73, 0x6d, 0x65, 0x2e, 0x4e, 0x65, 0x77, 0x47, 0x61, 0x6d,
	0x65, 0x41, 0x72, 0x67, 0x73, 0x1a, 0x18, 0x2e, 0x63, 0x72, 0x6f, 0x73, 0x73, 0x6d, 0x65, 0x2e,
	0x4e, 0x65, 0x77, 0x47, 0x61, 0x6d, 0x65, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12,
	0x41, 0x0a, 0x0b, 0x47, 0x65, 0x74, 0x47, 0x61, 0x6d, 0x65, 0x42, 0x79, 0x49, 0x64, 0x12, 0x18,
	0x2e, 0x63, 0x72, 0x6f, 0x73, 0x73, 0x6d, 0x65, 0x2e, 0x47, 0x65, 0x74, 0x47, 0x61, 0x6d, 0x65,
	0x42, 0x79, 0x49, 0x64, 0x41, 0x72, 0x67, 0x73, 0x1a, 0x18, 0x2e, 0x63, 0x72, 0x6f, 0x73, 0x73,
	0x6d, 0x65, 0x2e, 0x47, 0x65, 0x74, 0x47, 0x61, 0x6d, 0x65, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e,
	0x73, 0x65, 0x12, 0x48, 0x0a, 0x0c, 0x55, 0x70, 0x6c, 0x6f, 0x61, 0x64, 0x50, 0x75, 0x7a, 0x7a,
	0x6c, 0x65, 0x12, 0x19, 0x2e, 0x63, 0x72, 0x6f, 0x73, 0x73, 0x6d, 0x65, 0x2e, 0x55, 0x70, 0x6c,
	0x6f, 0x61, 0x64, 0x50, 0x75, 0x7a, 0x7a, 0x6c, 0x65, 0x41, 0x72, 0x67, 0x73, 0x1a, 0x1d, 0x2e,
	0x63, 0x72, 0x6f, 0x73, 0x73, 0x6d, 0x65, 0x2e, 0x55, 0x70, 0x6c, 0x6f, 0x61, 0x64, 0x50, 0x75,
	0x7a, 0x7a, 0x6c, 0x65, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x42, 0x0a, 0x0a,
	0x55, 0x70, 0x64, 0x61, 0x74, 0x65, 0x46, 0x69, 0x6c, 0x6c, 0x12, 0x17, 0x2e, 0x63, 0x72, 0x6f,
	0x73, 0x73, 0x6d, 0x65, 0x2e, 0x55, 0x70, 0x64, 0x61, 0x74, 0x65, 0x46, 0x69, 0x6c, 0x6c, 0x41,
	0x72, 0x67, 0x73, 0x1a, 0x1b, 0x2e, 0x63, 0x72, 0x6f, 0x73, 0x73, 0x6d, 0x65, 0x2e, 0x55, 0x70,
	0x64, 0x61, 0x74, 0x65, 0x46, 0x69, 0x6c, 0x6c, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65,
	0x12, 0x3e, 0x0a, 0x09, 0x53, 0x75, 0x62, 0x73, 0x63, 0x72, 0x69, 0x62, 0x65, 0x12, 0x16, 0x2e,
	0x63, 0x72, 0x6f, 0x73, 0x73, 0x6d, 0x65, 0x2e, 0x53, 0x75, 0x62, 0x73, 0x63, 0x72, 0x69, 0x62,
	0x65, 0x41, 0x72, 0x67, 0x73, 0x1a, 0x17, 0x2e, 0x63, 0x72, 0x6f, 0x73, 0x73, 0x6d, 0x65, 0x2e,
	0x53, 0x75, 0x62, 0x73, 0x63, 0x72, 0x69, 0x62, 0x65, 0x45, 0x76, 0x65, 0x6e, 0x74, 0x30, 0x01,
	0x42, 0x14, 0x5a, 0x12, 0x63, 0x72, 0x6f, 0x73, 0x73, 0x6d, 0x65, 0x2e, 0x61, 0x70, 0x70, 0x2f,
	0x73, 0x72, 0x63, 0x2f, 0x70, 0x62, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_crossme_proto_rawDescOnce sync.Once
	file_crossme_proto_rawDescData = file_crossme_proto_rawDesc
)

func file_crossme_proto_rawDescGZIP() []byte {
	file_crossme_proto_rawDescOnce.Do(func() {
		file_crossme_proto_rawDescData = protoimpl.X.CompressGZIP(file_crossme_proto_rawDescData)
	})
	return file_crossme_proto_rawDescData
}

var file_crossme_proto_msgTypes = make([]protoimpl.MessageInfo, 14)
var file_crossme_proto_goTypes = []interface{}{
	(*GetPuzzleIndexArgs)(nil),     // 0: crossme.GetPuzzleIndexArgs
	(*GetPuzzleIndexResponse)(nil), // 1: crossme.GetPuzzleIndexResponse
	(*GetPuzzleByIdArgs)(nil),      // 2: crossme.GetPuzzleByIdArgs
	(*GetPuzzleResponse)(nil),      // 3: crossme.GetPuzzleResponse
	(*NewGameArgs)(nil),            // 4: crossme.NewGameArgs
	(*NewGameResponse)(nil),        // 5: crossme.NewGameResponse
	(*GetGameByIdArgs)(nil),        // 6: crossme.GetGameByIdArgs
	(*GetGameResponse)(nil),        // 7: crossme.GetGameResponse
	(*UploadPuzzleArgs)(nil),       // 8: crossme.UploadPuzzleArgs
	(*UploadPuzzleResponse)(nil),   // 9: crossme.UploadPuzzleResponse
	(*SubscribeArgs)(nil),          // 10: crossme.SubscribeArgs
	(*SubscribeEvent)(nil),         // 11: crossme.SubscribeEvent
	(*UpdateFillArgs)(nil),         // 12: crossme.UpdateFillArgs
	(*UpdateFillResponse)(nil),     // 13: crossme.UpdateFillResponse
	(*PuzzleIndex)(nil),            // 14: crossme.PuzzleIndex
	(*Puzzle)(nil),                 // 15: crossme.Puzzle
	(*Game)(nil),                   // 16: crossme.Game
	(*Fill)(nil),                   // 17: crossme.Fill
}
var file_crossme_proto_depIdxs = []int32{
	14, // 0: crossme.GetPuzzleIndexResponse.puzzles:type_name -> crossme.PuzzleIndex
	15, // 1: crossme.GetPuzzleResponse.puzzle:type_name -> crossme.Puzzle
	16, // 2: crossme.NewGameResponse.game:type_name -> crossme.Game
	16, // 3: crossme.GetGameResponse.game:type_name -> crossme.Game
	15, // 4: crossme.GetGameResponse.puzzle:type_name -> crossme.Puzzle
	15, // 5: crossme.UploadPuzzleResponse.puzzle:type_name -> crossme.Puzzle
	17, // 6: crossme.SubscribeEvent.fill:type_name -> crossme.Fill
	17, // 7: crossme.UpdateFillArgs.fill:type_name -> crossme.Fill
	0,  // 8: crossme.CrossMe.GetPuzzleIndex:input_type -> crossme.GetPuzzleIndexArgs
	2,  // 9: crossme.CrossMe.GetPuzzleById:input_type -> crossme.GetPuzzleByIdArgs
	4,  // 10: crossme.CrossMe.NewGame:input_type -> crossme.NewGameArgs
	6,  // 11: crossme.CrossMe.GetGameById:input_type -> crossme.GetGameByIdArgs
	8,  // 12: crossme.CrossMe.UploadPuzzle:input_type -> crossme.UploadPuzzleArgs
	12, // 13: crossme.CrossMe.UpdateFill:input_type -> crossme.UpdateFillArgs
	10, // 14: crossme.CrossMe.Subscribe:input_type -> crossme.SubscribeArgs
	1,  // 15: crossme.CrossMe.GetPuzzleIndex:output_type -> crossme.GetPuzzleIndexResponse
	3,  // 16: crossme.CrossMe.GetPuzzleById:output_type -> crossme.GetPuzzleResponse
	5,  // 17: crossme.CrossMe.NewGame:output_type -> crossme.NewGameResponse
	7,  // 18: crossme.CrossMe.GetGameById:output_type -> crossme.GetGameResponse
	9,  // 19: crossme.CrossMe.UploadPuzzle:output_type -> crossme.UploadPuzzleResponse
	13, // 20: crossme.CrossMe.UpdateFill:output_type -> crossme.UpdateFillResponse
	11, // 21: crossme.CrossMe.Subscribe:output_type -> crossme.SubscribeEvent
	15, // [15:22] is the sub-list for method output_type
	8,  // [8:15] is the sub-list for method input_type
	8,  // [8:8] is the sub-list for extension type_name
	8,  // [8:8] is the sub-list for extension extendee
	0,  // [0:8] is the sub-list for field type_name
}

func init() { file_crossme_proto_init() }
func file_crossme_proto_init() {
	if File_crossme_proto != nil {
		return
	}
	file_puzzle_proto_init()
	file_fill_proto_init()
	file_game_proto_init()
	if !protoimpl.UnsafeEnabled {
		file_crossme_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*GetPuzzleIndexArgs); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_crossme_proto_msgTypes[1].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*GetPuzzleIndexResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_crossme_proto_msgTypes[2].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*GetPuzzleByIdArgs); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_crossme_proto_msgTypes[3].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*GetPuzzleResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_crossme_proto_msgTypes[4].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*NewGameArgs); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_crossme_proto_msgTypes[5].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*NewGameResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_crossme_proto_msgTypes[6].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*GetGameByIdArgs); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_crossme_proto_msgTypes[7].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*GetGameResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_crossme_proto_msgTypes[8].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*UploadPuzzleArgs); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_crossme_proto_msgTypes[9].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*UploadPuzzleResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_crossme_proto_msgTypes[10].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*SubscribeArgs); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_crossme_proto_msgTypes[11].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*SubscribeEvent); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_crossme_proto_msgTypes[12].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*UpdateFillArgs); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_crossme_proto_msgTypes[13].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*UpdateFillResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
	}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_crossme_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   14,
			NumExtensions: 0,
			NumServices:   1,
		},
		GoTypes:           file_crossme_proto_goTypes,
		DependencyIndexes: file_crossme_proto_depIdxs,
		MessageInfos:      file_crossme_proto_msgTypes,
	}.Build()
	File_crossme_proto = out.File
	file_crossme_proto_rawDesc = nil
	file_crossme_proto_goTypes = nil
	file_crossme_proto_depIdxs = nil
}
