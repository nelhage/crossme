# syntax=docker/dockerfile:1

# Keep GO_VERSION in sync with go.mod. The builder and the runtime pin the same
# Alpine release so the cgo build and the runtime agree on musl.
ARG GO_VERSION=1.25
ARG ALPINE_VERSION=3.22

FROM golang:${GO_VERSION}-alpine${ALPINE_VERSION} AS build

# github.com/mattn/go-sqlite3 is a cgo package, so we need a C toolchain.
RUN apk add --no-cache build-base

WORKDIR /src

# Download modules in their own layer so editing source doesn't refetch them.
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY . .

# Link statically so the resulting binaries don't care what's in the runtime
# image. sqlite_omit_load_extension drops sqlite's extension loader, which we
# never use and don't want to expose.
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=1 go build \
      -trimpath \
      -tags sqlite_omit_load_extension \
      -ldflags '-s -w -extldflags "-static"' \
      -o /out/ ./cmd/...

FROM alpine:${ALPINE_VERSION}

RUN apk add --no-cache ca-certificates tzdata \
 && adduser -S -D -H -u 10001 crossme \
 && mkdir -p /data \
 && chown crossme /data

COPY --from=build /out/crossme /out/crossme-build-db /usr/local/bin/

# The sqlite database lives here; mount a volume over it to make it durable.
VOLUME /data
USER crossme
EXPOSE 4000

# wget exits 8 when the server returns an HTTP error; the Connect handler 404s
# on a bare GET, so either a success or an 8 means we're serving.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q -O /dev/null http://127.0.0.1:4000/api/ || [ "$?" = 8 ]

ENTRYPOINT ["crossme"]
CMD ["-bind", "0.0.0.0:4000", "-db", "/data/crossme.db"]
