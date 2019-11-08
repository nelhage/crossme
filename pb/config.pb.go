// Code generated by protoc-gen-go. DO NOT EDIT.
// source: config.proto

package pb

import (
	fmt "fmt"
	proto "github.com/golang/protobuf/proto"
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

type Config struct {
	SchemaVersion        int32    `protobuf:"varint,1,opt,name=schema_version,json=schemaVersion,proto3" json:"schema_version,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *Config) Reset()         { *m = Config{} }
func (m *Config) String() string { return proto.CompactTextString(m) }
func (*Config) ProtoMessage()    {}
func (*Config) Descriptor() ([]byte, []int) {
	return fileDescriptor_3eaf2c85e69e9ea4, []int{0}
}

func (m *Config) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_Config.Unmarshal(m, b)
}
func (m *Config) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_Config.Marshal(b, m, deterministic)
}
func (m *Config) XXX_Merge(src proto.Message) {
	xxx_messageInfo_Config.Merge(m, src)
}
func (m *Config) XXX_Size() int {
	return xxx_messageInfo_Config.Size(m)
}
func (m *Config) XXX_DiscardUnknown() {
	xxx_messageInfo_Config.DiscardUnknown(m)
}

var xxx_messageInfo_Config proto.InternalMessageInfo

func (m *Config) GetSchemaVersion() int32 {
	if m != nil {
		return m.SchemaVersion
	}
	return 0
}

func init() {
	proto.RegisterType((*Config)(nil), "crossme.Config")
}

func init() { proto.RegisterFile("config.proto", fileDescriptor_3eaf2c85e69e9ea4) }

var fileDescriptor_3eaf2c85e69e9ea4 = []byte{
	// 107 bytes of a gzipped FileDescriptorProto
	0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xff, 0xe2, 0xe2, 0x49, 0xce, 0xcf, 0x4b,
	0xcb, 0x4c, 0xd7, 0x2b, 0x28, 0xca, 0x2f, 0xc9, 0x17, 0x62, 0x4f, 0x2e, 0xca, 0x2f, 0x2e, 0xce,
	0x4d, 0x55, 0xd2, 0xe7, 0x62, 0x73, 0x06, 0x4b, 0x08, 0xa9, 0x72, 0xf1, 0x15, 0x27, 0x67, 0xa4,
	0xe6, 0x26, 0xc6, 0x97, 0xa5, 0x16, 0x15, 0x67, 0xe6, 0xe7, 0x49, 0x30, 0x2a, 0x30, 0x6a, 0xb0,
	0x06, 0xf1, 0x42, 0x44, 0xc3, 0x20, 0x82, 0x4e, 0x22, 0x51, 0x42, 0x50, 0xbd, 0x7a, 0x89, 0x05,
	0x05, 0xfa, 0xc5, 0x45, 0xc9, 0xfa, 0x05, 0x49, 0x49, 0x6c, 0x60, 0x63, 0x8d, 0x01, 0x01, 0x00,
	0x00, 0xff, 0xff, 0x92, 0x42, 0x62, 0x3e, 0x66, 0x00, 0x00, 0x00,
}
