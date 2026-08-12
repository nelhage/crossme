import { fromJson, toJson } from "@bufbuild/protobuf";

import { Fill, FillSchema } from "../pb/fill_pb";
import { merge } from "./merge";

import * as fs from "node:fs";
import * as path from "node:path";

// The test vectors are protobuf JSON, shared with the Go merge tests
// (see crdt/merge_test.go) through the `testdata` symlink.
function readFill(path: string): Fill {
  return fromJson(FillSchema, JSON.parse(fs.readFileSync(path, "utf8")));
}

function assertMerge(_name: string, l: Fill, r: Fill, want: Fill): Fill {
  const got = merge(l, r);
  const gotstr = JSON.stringify(toJson(FillSchema, got), null, 2);
  const wantstr = JSON.stringify(toJson(FillSchema, want), null, 2);
  expect(gotstr).toEqual(wantstr);
  return got;
}

function runOne(dir: string) {
  const l = readFill(path.join(dir, "left.json"));
  const r = readFill(path.join(dir, "right.json"));

  // A case carrying an `ERROR` file in place of a `merged.json` has
  // illegal inputs, and the merge must reject them. The file's contents
  // explain why, for the reader; nothing checks them.
  if (fs.existsSync(path.join(dir, "ERROR"))) {
    expect(() => merge(l, r)).toThrow();
    expect(() => merge(r, l)).toThrow();
    return;
  }

  const m = readFill(path.join(dir, "merged.json"));

  const m1 = assertMerge("(left, right)", l, r, m);
  const m2 = assertMerge("(right, left)", r, l, m);

  assertMerge("(left, right), m", m1, m, m);
  assertMerge("(right, left), m", m2, m, m);
  assertMerge("m, (left, right)", m, m1, m);
  assertMerge("m, (right, left)", m, m2, m);
  assertMerge("m, m", m, m, m);
}

describe("merge", () => {
  const TEST_DIR = path.join(import.meta.dirname, "testdata/merge");
  const dirs = fs.readdirSync(TEST_DIR);
  dirs.forEach((dir) => {
    it(`Test case: ${dir}`, () => {
      runOne(path.join(TEST_DIR, dir));
    });
  });
});

// Three-way merges must converge to the same state regardless of the
// order or association of the merges; see runAssociative in
// crdt/merge_test.go.
function runAssociative(dir: string) {
  const a = readFill(path.join(dir, "a.json"));
  const b = readFill(path.join(dir, "b.json"));
  const c = readFill(path.join(dir, "c.json"));
  const m = readFill(path.join(dir, "merged.json"));

  const perms: [Fill, Fill, Fill][] = [
    [a, b, c],
    [a, c, b],
    [b, a, c],
    [b, c, a],
    [c, a, b],
    [c, b, a],
  ];
  perms.forEach(([x, y, z]) => {
    assertMerge("left-assoc", merge(x, y), z, m);
    assertMerge("right-assoc", x, merge(y, z), m);
  });
}

describe("merge associativity", () => {
  const TEST_DIR = path.join(import.meta.dirname, "testdata/associative");
  const dirs = fs.readdirSync(TEST_DIR);
  dirs.forEach((dir) => {
    it(`Test case: ${dir}`, () => {
      runAssociative(path.join(TEST_DIR, dir));
    });
  });
});
