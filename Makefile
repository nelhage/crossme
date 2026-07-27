proto_src := $(wildcard pb/*.proto)
proto_out := $(patsubst %.proto,%.pb.go,$(proto_src)) \
	     $(patsubst %.proto,client/src/%_pb.ts,$(proto_src)) \
	     pb/pbconnect/crossme.connect.go

build: proto
	go build ./...

test: proto
	go test ./...

$(proto_out): $(proto_src)
	scripts/gen-proto

proto: $(proto_out)
