proto_src := $(wildcard pb/*.proto)
proto_out := $(patsubst %.proto,%.pb.go,$(proto_src)) $(patsubst %.proto,v2/src/%_pb.js,$(proto_src))

build: proto
	go build ./...

test: proto
	go test ./...

$(proto_out): $(proto_src)
	scripts/gen-proto

proto: $(proto_out)
