import { Fill } from "../pb/fill_pb";
import { merge } from "./merge";

import * as fs from "fs";
import * as path from "path";

function readFill(path: string): Fill {
  const bytes = fs.readFileSync(path);
  return Fill.deserializeBinary(bytes);
}

function assertMerge(name: string, l: Fill, r: Fill, want: Fill): Fill {
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
  const TEST_DIR = path.join(__dirname, "testdata/merge");
  const dirs = fs.readdirSync(TEST_DIR);
  dirs.forEach(dir => {
    it(`Test case: ${dir}`, () => {
      runOne(path.join(TEST_DIR, dir));
    });
  });
});
