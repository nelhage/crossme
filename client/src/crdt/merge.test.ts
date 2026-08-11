import { fromBinary, toJson } from "@bufbuild/protobuf";

import { Fill, FillSchema } from "../pb/fill_pb";
import { merge } from "./merge";

import * as fs from "node:fs";
import * as path from "node:path";

function readFill(path: string): Fill {
  return fromBinary(FillSchema, new Uint8Array(fs.readFileSync(path)));
}

function assertMerge(_name: string, l: Fill, r: Fill, want: Fill): Fill {
  const got = merge(l, r);
  const gotstr = JSON.stringify(toJson(FillSchema, got), null, 2);
  const wantstr = JSON.stringify(toJson(FillSchema, want), null, 2);
  expect(gotstr).toEqual(wantstr);
  return got;
}

function runOne(dir: string) {
  const l = readFill(path.join(dir, "left.dat"));
  const r = readFill(path.join(dir, "right.dat"));
  const m = readFill(path.join(dir, "merged.dat"));

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
// crdt/merge_test.go, which also generates the .dat files.
function runAssociative(dir: string) {
  const a = readFill(path.join(dir, "a.dat"));
  const b = readFill(path.join(dir, "b.dat"));
  const c = readFill(path.join(dir, "c.dat"));
  const m = readFill(path.join(dir, "merged.dat"));

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
