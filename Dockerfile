FROM golang:alpine
ADD . /crossme
WORKDIR /crossme
RUN mkdir bin && env GOBIN=/crossme/bin go install ./cmd/...

FROM alpine
RUN mkdir -p /crossme/bin/
COPY --from=0 /crossme/bin /crossme/bin
