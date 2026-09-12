package crdt

// Cross-language differential tests: the Go Merge in this package and
// its TypeScript port in client/src/crdt/merge.ts must agree, cell for
// cell, on the same inputs.
//
// The two implementations are maintained in parallel and a divergence
// between them is a live bug -- clients and the server both merge, and
// a state that merges differently on the two sides does not converge.
// The shared JSON vectors under testdata/merge cover a handful of
// hand-written cases; these tests instead feed both implementations the
// same hegel-generated fills (see gen_test.go for the "shared universe
// of writes" model) and compare the results.
//
// # The bridge
//
// The TypeScript side is reached by running it: a small Node process,
// client/src/crdt/merge_bridge.ts, reads merge requests on stdin and
// writes results to stdout, one newline-delimited JSON object per line,
// in order:
//
//	Request:  {"id": <int>, "left": <Fill JSON>, "right": <Fill JSON>}
//	Response: {"id": <int>, "merged": <Fill JSON>}
//	      or  {"id": <int>, "error": "<message>"}
//
// Fill JSON is the proto3 JSON mapping on both sides: we marshal with
// protojson (compacted, since protojson deliberately emits unstable
// whitespace and the protocol is line-oriented) and unmarshal the reply
// with protojson too. An `error` response is a merge that the
// TypeScript implementation rejected, which is a normal outcome for the
// malformed inputs of TestMergeCrossLanguageErrors; a malformed line, a
// mismatched id, or EOF is a bridge failure and fails the test outright.
//
// Test bodies run sequentially, so each test starts one bridge process
// and reuses it for every case.
//
// # Skipping
//
// These tests need Node and the client's node_modules. When node is not
// on PATH, or client/node_modules/tsx or the bridge script is missing,
// they skip -- a Go-only checkout can still run `go test ./...`. Setting
// CROSSME_CROSS_TEST=require turns every one of those skips into a
// failure; CI sets it, so the cross-check cannot quietly stop running.

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"
	"sync"
	"testing"

	"crossme.app/src/pb"

	"google.golang.org/protobuf/encoding/protojson"
	"hegel.dev/go/hegel"
)

// requireEnv is the environment variable that turns the "prerequisites
// missing" skip into a hard failure.
const requireEnv = "CROSSME_CROSS_TEST"

// clientDir is the client/ directory, relative to this package's
// directory (which is the working directory of a `go test` run).
const clientDir = "../client"

// bridgeScript is the bridge entry point, relative to clientDir.
const bridgeScript = "src/crdt/merge_bridge.ts"

// nodeBridge is a running merge_bridge.ts process, wrapped in the
// request/response protocol described in the file comment. It is not
// safe for concurrent use; hegel test bodies run sequentially.
type nodeBridge struct {
	stdin  io.WriteCloser
	stdout *bufio.Reader
	nextID int
}

// bridgeRequest and bridgeResponse are the wire messages. Fill payloads
// stay as raw JSON in both directions so that protojson, not
// encoding/json, is the only thing that ever interprets them.
type bridgeRequest struct {
	ID    int             `json:"id"`
	Left  json.RawMessage `json:"left"`
	Right json.RawMessage `json:"right"`
}

type bridgeResponse struct {
	ID     int             `json:"id"`
	Merged json.RawMessage `json:"merged,omitempty"`
	Error  string          `json:"error,omitempty"`
}

// skipOrFatal reports a missing prerequisite: normally a skip, but a
// fatal error when CROSSME_CROSS_TEST=require, so that CI notices if the
// cross-language check silently stops running.
func skipOrFatal(t testing.TB, format string, args ...any) {
	t.Helper()
	msg := fmt.Sprintf(format, args...)
	msg += "; to enable these tests, install Node 22+ and run `cd client && npm ci`"
	if os.Getenv(requireEnv) == "require" {
		t.Fatalf("%s=require but %s", requireEnv, msg)
	}
	t.Skipf("skipping cross-language merge test: %s", msg)
}

// startBridge launches one merge_bridge.ts process for the duration of
// the test, skipping (or failing, under CROSSME_CROSS_TEST=require) if
// the prerequisites are not installed.
func startBridge(t testing.TB) *nodeBridge {
	t.Helper()

	node, err := exec.LookPath("node")
	if err != nil {
		skipOrFatal(t, "node not found on PATH: %v", err)
	}
	dir, err := filepath.Abs(clientDir)
	if err != nil {
		t.Fatalf("Abs(%q): %v", clientDir, err)
	}
	for _, dep := range []string{"node_modules/tsx", bridgeScript} {
		p := filepath.Join(dir, dep)
		if _, err := os.Stat(p); err != nil {
			skipOrFatal(t, "%s is missing: %v", p, err)
		}
	}

	ctx, cancel := context.WithCancel(context.Background())
	cmd := exec.CommandContext(ctx, node, "--import", "tsx", bridgeScript)
	cmd.Dir = dir

	stdin, err := cmd.StdinPipe()
	if err != nil {
		cancel()
		t.Fatalf("StdinPipe: %v", err)
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		t.Fatalf("StdoutPipe: %v", err)
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		cancel()
		t.Fatalf("StderrPipe: %v", err)
	}
	if err := cmd.Start(); err != nil {
		cancel()
		t.Fatalf("starting %s: %v", bridgeScript, err)
	}

	// Forward the bridge's diagnostics into the test log. Wait blocks
	// until this goroutine has drained stderr, so signal when it is
	// done rather than racing the cleanup below.
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		scan := bufio.NewScanner(stderr)
		scan.Buffer(make([]byte, 0, 64*1024), 4*1024*1024)
		for scan.Scan() {
			t.Logf("merge_bridge: %s", scan.Text())
		}
	}()

	b := &nodeBridge{
		stdin: stdin,
		// Fills are small, but a merge result is one line and
		// bufio.Scanner's default 64KB cap is a silent truncation
		// hazard; ReadString on a generous Reader has no such limit.
		stdout: bufio.NewReaderSize(stdout, 1<<20),
	}

	t.Cleanup(func() {
		// Closing stdin is the bridge's shutdown signal; it flushes
		// and exits 0 on EOF. Drain stderr before Wait, which closes
		// the pipe out from under the forwarding goroutine.
		stdin.Close()
		wg.Wait()
		err := cmd.Wait()
		cancel()
		if err != nil {
			t.Errorf("merge_bridge exited with an error: %v", err)
		}
	})

	return b
}

// merge asks the bridge to merge l and r using the TypeScript
// implementation.
//
// mergeErr is a merge the TypeScript side rejected -- the expected
// outcome for malformed inputs. err is a failure of the bridge itself
// (bad JSON, a mismatched id, EOF), which means the test can no longer
// trust the process and should stop.
func (b *nodeBridge) merge(l, r *pb.Fill) (merged *pb.Fill, mergeErr error, err error) {
	b.nextID++
	id := b.nextID

	left, err := marshalFill(l)
	if err != nil {
		return nil, nil, err
	}
	right, err := marshalFill(r)
	if err != nil {
		return nil, nil, err
	}

	line, err := json.Marshal(bridgeRequest{ID: id, Left: left, Right: right})
	if err != nil {
		return nil, nil, fmt.Errorf("marshaling request %d: %w", id, err)
	}
	if _, err := b.stdin.Write(append(line, '\n')); err != nil {
		return nil, nil, fmt.Errorf("writing request %d: %w", id, err)
	}

	reply, err := b.stdout.ReadString('\n')
	if err != nil {
		return nil, nil, fmt.Errorf("reading response %d: %w", id, err)
	}
	var resp bridgeResponse
	if err := json.Unmarshal([]byte(strings.TrimSpace(reply)), &resp); err != nil {
		return nil, nil, fmt.Errorf("parsing response %d (%q): %w", id, reply, err)
	}
	if resp.ID != id {
		return nil, nil, fmt.Errorf("response id mismatch: got %d, want %d", resp.ID, id)
	}
	if resp.Error != "" {
		return nil, errors.New(resp.Error), nil
	}
	if resp.Merged == nil {
		return nil, nil, fmt.Errorf("response %d has neither merged nor error", id)
	}
	out := &pb.Fill{}
	if err := protojson.Unmarshal(resp.Merged, out); err != nil {
		return nil, nil, fmt.Errorf("unmarshaling merged fill of response %d (%q): %w",
			id, resp.Merged, err)
	}
	return out, nil, nil
}

// marshalFill renders f as single-line proto3 JSON. protojson
// deliberately randomizes its whitespace, so compact it: the bridge
// protocol is line-oriented, and stable bytes make failures readable.
func marshalFill(f *pb.Fill) (json.RawMessage, error) {
	raw, err := protojson.Marshal(f)
	if err != nil {
		return nil, fmt.Errorf("protojson.Marshal(%s): %w", fillString(f), err)
	}
	var buf bytes.Buffer
	if err := json.Compact(&buf, raw); err != nil {
		return nil, fmt.Errorf("compacting %q: %w", raw, err)
	}
	return json.RawMessage(buf.Bytes()), nil
}

// crossCheck merges l and r with both implementations and reports any
// disagreement: on whether the inputs are legal at all, and on the
// merged result. label names the pair in failure messages.
//
// Both implementations canonicalize their output (sorted node table,
// owners remapped, cells in index order), so exact proto equality is
// the right comparison here -- fillsIdentical, not fillsEqual. A
// failure that fillsEqual would have accepted means one side stopped
// canonicalizing, which is itself worth knowing about.
func crossCheck(ht *hegel.T, b *nodeBridge, label string, l, r *pb.Fill) *pb.Fill {
	goOut, goErr := Merge(l, r)
	tsOut, tsErr, err := b.merge(l, r)
	if err != nil {
		ht.Fatalf("merge bridge failed on %s: %v", label, err)
	}

	if goErr != nil {
		ht.Fatalf("Go Merge(%s) failed on well-formed inputs: %v", label, goErr)
	}
	if tsErr != nil {
		ht.Fatalf("TypeScript merge(%s) failed on well-formed inputs Go accepted: %v",
			label, tsErr)
	}
	ht.Note("go(" + label + ") = " + fillString(goOut))
	ht.Note("ts(" + label + ") = " + fillString(tsOut))
	if !fillsIdentical(goOut, tsOut) {
		ht.Fatalf("Go and TypeScript merge disagree on %s:\n  go = %s\n  ts = %s",
			label, fillString(goOut), fillString(tsOut))
	}
	return goOut
}

// TestMergeCrossLanguage checks that the Go and TypeScript merges agree
// on generated fills drawn from a shared universe of writes, both on
// freshly generated inputs and on a canonical merge output fed back in
// as an input.
func TestMergeCrossLanguage(t *testing.T) {
	b := startBridge(t)

	hegel.Test(t, func(ht *hegel.T) {
		fills := hegel.Draw(ht, genScenario(3))
		a, c, d := fills[0], fills[1], fills[2]
		ht.Note("a = " + fillString(a))
		ht.Note("b = " + fillString(c))
		ht.Note("c = " + fillString(d))

		ab := crossCheck(ht, b, "a, b", a, c)
		// Merge outputs are the inputs the real system actually feeds
		// back in, so check the two implementations agree on those too
		// -- with the Go output as the left side, which also pins the
		// TypeScript side to Go's exact canonical shape.
		crossCheck(ht, b, "Merge(a, b), c", ab, d)
	}, hegel.WithTestCases(500))
}

// TestMergeCrossLanguageErrors checks that the two implementations
// reject the same malformed inputs, in both argument orders. A merge
// that one side rejects and the other quietly accepts is a divergence
// as real as a differing result.
func TestMergeCrossLanguageErrors(t *testing.T) {
	b := startBridge(t)

	hegel.Test(t, func(ht *hegel.T) {
		p := hegel.Draw(ht, genMalformedPair())
		ht.Note("why: " + p.Why)
		ht.Note("L: " + fillString(p.L))
		ht.Note("R: " + fillString(p.R))

		for _, order := range []struct {
			label string
			l, r  *pb.Fill
		}{
			{"L, R", p.L, p.R},
			{"R, L", p.R, p.L},
		} {
			_, goErr := Merge(order.l, order.r)
			_, tsErr, err := b.merge(order.l, order.r)
			if err != nil {
				ht.Fatalf("merge bridge failed on (%s): %v", order.label, err)
			}
			if goErr == nil {
				ht.Fatalf("Go Merge(%s) accepted a malformed pair (%s)", order.label, p.Why)
			}
			if tsErr == nil {
				ht.Fatalf("TypeScript merge(%s) accepted a malformed pair (%s)",
					order.label, p.Why)
			}
			ht.Note(fmt.Sprintf("go(%s) rejected: %v", order.label, goErr))
			ht.Note(fmt.Sprintf("ts(%s) rejected: %v", order.label, tsErr))
		}
	}, hegel.WithTestCases(300))
}

// TestMergeCrossLanguageVectors runs the shared testdata/merge vectors
// through both implementations. It duplicates no coverage the property
// tests have, but it is deterministic and hegel-independent: if the
// generators or hegel itself break, this still says whether the two
// merges agree on the recorded cases.
func TestMergeCrossLanguageVectors(t *testing.T) {
	b := startBridge(t)

	dents, err := os.ReadDir("testdata/merge")
	if err != nil {
		t.Fatalf("readdir: %v", err)
	}
	for _, d := range dents {
		dir := path.Join("testdata/merge", d.Name())
		t.Run(d.Name(), func(t *testing.T) {
			// No t.Parallel: subtests share the one bridge process.
			l := mustReadFile(t, path.Join(dir, "left.json"))
			r := mustReadFile(t, path.Join(dir, "right.json"))
			wantErr := expectsError(t, dir)

			for _, order := range []struct {
				label string
				l, r  *pb.Fill
			}{
				{"left, right", l, r},
				{"right, left", r, l},
			} {
				goOut, goErr := Merge(order.l, order.r)
				tsOut, tsErr, err := b.merge(order.l, order.r)
				if err != nil {
					t.Fatalf("merge bridge failed on (%s): %v", order.label, err)
				}

				if wantErr {
					if goErr == nil {
						t.Errorf("Go Merge(%s): expected an error", order.label)
					}
					if tsErr == nil {
						t.Errorf("TypeScript merge(%s): expected an error", order.label)
					}
					continue
				}

				if goErr != nil {
					t.Fatalf("Go Merge(%s): %v", order.label, goErr)
				}
				if tsErr != nil {
					t.Fatalf("TypeScript merge(%s): %v", order.label, tsErr)
				}
				if !fillsIdentical(goOut, tsOut) {
					t.Errorf("Go and TypeScript merge disagree on (%s):\n  go = %s\n  ts = %s",
						order.label, fillString(goOut), fillString(tsOut))
				}
			}
		})
	}
}
