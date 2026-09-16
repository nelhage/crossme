// merge_bridge.ts -- stdio bridge exposing the TypeScript CRDT `merge`
// implementation to a driver written in another language (in practice,
// a Go test that fuzzes/compares the Go and TypeScript merge
// implementations against each other on generated `Fill` inputs).
//
// Protocol: newline-delimited JSON, one request per line, processed
// strictly in order, with exactly one response line written per
// request line before the next is read.
//
//   Request:  {"id": <number>, "left": <Fill JSON>, "right": <Fill JSON>}
//   Response: {"id": <same number>, "merged": <Fill JSON>}
//          or {"id": <same number>, "error": "<message>"}
//
// `Fill JSON` is the proto3 JSON mapping as produced/accepted by
// `toJson`/`fromJson` from @bufbuild/protobuf for the `Fill` message
// (see src/pb/fill_pb.ts). Any field may be omitted; int64 fields
// (`clock`) may be given as a JSON string or number on input (both are
// accepted by `fromJson`) and are always emitted as a string on
// output, matching Go's protojson encoding.
//
// A line that isn't valid JSON, or is valid JSON without a numeric
// `id`, is a protocol error: a diagnostic is written to stderr and the
// process exits with code 2. Errors thrown by `fromJson` or `merge`
// for a well-formed request (e.g. malformed Fill contents) are instead
// reported in that request's response line via the `error` field, and
// processing continues with the next line.
//
// On stdin EOF, the process flushes stdout and exits 0. Writing to a
// closed stdout (EPIPE) is treated the same way, since there is no
// reader left to care about the remaining output.
//
// Run from the `client/` directory:
//
//   node --import tsx src/crdt/merge_bridge.ts
//
// Example:
//
//   printf '%s\n' '{"id":1,"left":{},"right":{}}' \
//     | node --import tsx src/crdt/merge_bridge.ts

import { createInterface } from "node:readline";

import { fromJson, toJson, type JsonValue } from "@bufbuild/protobuf";

import { merge } from "./merge";
import { FillSchema } from "../pb/fill_pb";

type Request = {
  id: number;
  left?: JsonValue;
  right?: JsonValue;
};

function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

function isRequest(value: unknown): value is Request {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { id: unknown }).id === "number"
  );
}

// Once stdout has hit EPIPE there's no reader left; treat that as a
// clean shutdown rather than an uncaught-exception crash.
process.stdout.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EPIPE") {
    process.exit(0);
  }
  throw err;
});

const rl = createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

rl.on("line", (line: string) => {
  const trimmed = line.trim();
  if (trimmed === "") {
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    process.stderr.write(
      `merge_bridge: invalid JSON line: ${errorMessage(err)}\n`
    );
    process.exit(2);
  }

  if (!isRequest(parsed)) {
    process.stderr.write('merge_bridge: request missing numeric "id"\n');
    process.exit(2);
  }

  const { id, left, right } = parsed;

  let responseLine: string;
  try {
    const l = fromJson(FillSchema, left ?? {});
    const r = fromJson(FillSchema, right ?? {});
    const merged = merge(l, r);
    responseLine = JSON.stringify({ id, merged: toJson(FillSchema, merged) });
  } catch (err) {
    responseLine = JSON.stringify({ id, error: errorMessage(err) });
  }

  process.stdout.write(responseLine + "\n");
});

rl.on("close", () => {
  process.exit(0);
});
