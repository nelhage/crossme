import { Fill } from "../pb/fill_pb";
import { merge } from "./merge";

import * as fs from "node:fs";
import * as path from "node:path";

function readFill(path: string): Fill {
  // Copy into a plain Uint8Array: `readFileSync` returns a Node Buffer from
  // another realm, which google-protobuf's `instanceof` check rejects under
  // the jsdom test environment.
  const bytes = new Uint8Array(fs.readFileSync(path));
  return Fill.deserializeBinary(bytes);
}

function assertMerge(_name: string, l: Fill, r: Fill, want: Fill): Fill {
  const got = merge(l, r);
  const gotstr = JSON.stringify(got.toObject(), null, 2);
  const wantstr = JSON.stringify(want.toObject(), null, 2);
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
