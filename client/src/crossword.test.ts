import * as Crossword from "./crossword";
import * as Types from "./types";
import { create } from "@bufbuild/protobuf";
import { FillSchema } from "./pb/fill_pb";

function computeNumbering(
  { width, height }: { width: number; height: number },
  grid: Types.Cell[]
): [Types.Clue[], Types.Clue[]] {
  const at: (r: number, c: number) => Types.Cell = (r, c) =>
    grid[r * width + c];
  // Whether a word continues from (r, c) to the next cell: no block
  // and no bar in the way.
  const joinsRight = (r: number, c: number) => {
    const sq = at(r, c);
    return !sq.black && !sq.barRight && c + 1 < width && !at(r, c + 1).black;
  };
  const joinsDown = (r: number, c: number) => {
    const sq = at(r, c);
    return !sq.black && !sq.barBottom && r + 1 < height && !at(r + 1, c).black;
  };
  const needsAcross: (row: number, column: number) => boolean = (r, c) =>
    !(c > 0 && joinsRight(r, c - 1)) && joinsRight(r, c);
  const needsDown: (row: number, column: number) => boolean = (r, c) =>
    !(r > 0 && joinsDown(r - 1, c)) && joinsDown(r, c);

  const across: Types.Clue[] = [];
  const down: Types.Clue[] = [];

  let n = 1;
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < height; c++) {
      const cell = at(r, c);
      if (cell.black) {
        continue;
      }
      if (!needsAcross(r, c) && !needsDown(r, c)) {
        continue;
      }
      (cell as Types.LetterCell).number = n;
      if (needsDown(r, c)) {
        down.push({ number: n, text: `Down clue ${n}` });
        for (let rr = r; ; rr++) {
          (at(rr, c) as Types.LetterCell).clueDown = n;
          if (!joinsDown(rr, c)) {
            break;
          }
        }
      }
      if (needsAcross(r, c)) {
        across.push({ number: n, text: `Across clue ${n}` });
        for (let cc = c; ; cc++) {
          (at(r, cc) as Types.LetterCell).clueAcross = n;
          if (!joinsRight(r, cc)) {
            break;
          }
        }
      }
      n += 1;
    }
  }
  return [across, down];
}

// Bars for a barred grid, as [row, column] of the cell on the left /
// upper side of the bar.
interface Bars {
  right?: [number, number][];
  bottom?: [number, number][];
}

function parseGame(template: string, bars?: Bars): Crossword.Game {
  template = template.trim();
  const lines = template.split("\n");
  const height = lines.length;

  const grid: Types.Cell[] = [];
  const fill: (string | undefined)[][] = [];
  let cursor: undefined | Types.Cursor;

  lines.forEach((line, r) => {
    const fills: (string | undefined)[] = [];
    for (let i = 0; i < line.length; i += 2) {
      const ch = line[i];
      let fill: string | undefined;
      if (ch === "#") {
        grid.push({ black: true });
      } else if (ch === ".") {
        grid.push({ black: false, fill: "X", clueAcross: 0, clueDown: 0 });
      } else if (ch.match(/[A-Z]/)) {
        grid.push({ black: false, fill: ch, clueAcross: 0, clueDown: 0 });
        fill = ch;
      } else {
        throw new Error(`bad fill char: '${ch}'`);
      }
      if (line[i + 1] === "(") {
        const sq = grid[grid.length - 1];
        if (sq.black) {
          throw new Error("Attemping to set fill of a black square");
        }
        if (line[i + 3] !== ")") {
          throw new Error("Expected matching paren");
        }
        sq.fill = line[i + 2];
        i += 3;
      }
      fills.push(fill);

      switch (line[i + 1]) {
        case undefined:
        case " ":
          break;
        case ">":
        case "v":
          if (cursor) {
            throw new Error("multiple cursors!");
          }
          if (grid[grid.length - 1].black) {
            throw new Error("selected black cell");
          }
          cursor = {
            row: r,
            column: fills.length - 1,
            direction:
              line[i + 1] === ">"
                ? Types.Direction.ACROSS
                : Types.Direction.DOWN,
            pencil: false,
          };
          break;
        default:
          throw new Error(`bad cursor char: '${line[i + 1]}'`);
      }
    }
    fill.push(fills);
  });
  const width = fill[0].length;
  fill.forEach((line, i) => {
    if (line.length !== width) {
      throw new Error(`Row ${i} bad width: ${line.length}`);
    }
  });

  if (!cursor) {
    throw new Error("no cursor found");
  }

  for (const [r, c] of bars?.right ?? []) {
    (grid[r * width + c] as Types.LetterCell).barRight = true;
  }
  for (const [r, c] of bars?.bottom ?? []) {
    (grid[r * width + c] as Types.LetterCell).barBottom = true;
  }

  const [across_clues, down_clues] = computeNumbering({ width, height }, grid);

  const puzzle: Types.Puzzle = {
    id: "testtest",
    title: "Test Puzzle",
    author: "Test Author",
    copyright: "Test Copyright",
    width,
    height,
    squares: grid,
    across_clues: across_clues,
    down_clues: down_clues,
  };

  return Crossword.withFills(
    Crossword.withCursor(Crossword.newGame(puzzle), cursor),
    fill
  );
}

function formatGame(g: Crossword.Game): string {
  const rows: string[] = [];
  for (let r = 0; r < g.puzzle.height; r++) {
    const row: string[] = [];
    for (let c = 0; c < g.puzzle.width; c++) {
      const sq = Crossword.cellAt(g.puzzle, { row: r, column: c });
      let ch: string;
      if (sq.black) {
        ch = "#";
      } else {
        const fill = Crossword.fillAt(g, { row: r, column: c });
        if (fill && fill.fill) {
          ch = fill.fill;
        } else {
          ch = ".";
        }
      }

      if (r === g.cursor.row && c === g.cursor.column) {
        if (g.cursor.direction === Types.Direction.ACROSS) {
          ch += ">";
        } else {
          ch += "v";
        }
      } else {
        ch += " ";
      }
      row.push(ch);
    }
    rows.push(row.join("").trimEnd());
  }
  return rows.join("\n");
}

it("can construct puzzles from a template", () => {
  const g = parseGame(`
# Sv. T #
E L F I N
R A # M I
A V A I L
# E N D #
`);
  expect(g.puzzle.width).toEqual(5);
  expect(g.puzzle.height).toEqual(5);
  expect(g.cursor.row).toEqual(0);
  expect(g.cursor.column).toEqual(1);
  expect(g.cursor.direction).toEqual(Types.Direction.DOWN);

  expect(Crossword.fillAt(g, { row: 0, column: 1 })).toHaveProperty(
    "fill",
    "S"
  );
  expect(Crossword.fillAt(g, { row: 0, column: 2 })).toBeUndefined();
});

describe("crossword operations", () => {
  const testCases: [
    string,
    string,
    (g: Crossword.Game) => Crossword.GameUpdate,
    string,
  ][] = [
    [
      "Type into empty word",
      `
# .>. . #
. . . . .
. . # . .
. . . . .
# . . . #
`,
      (g) => Crossword.keypress(g, "A"),
      `
# A .>. #
. . . . .
. . # . .
. . . . .
# . . . #
`,
    ],
    [
      "Skip filled squares",
      `
# .>B . #
. . . . .
. . # . .
. . . . .
# . . . #
`,
      (g) => Crossword.keypress(g, "A"),
      `
# A B .>#
. . . . .
. . # . .
. . . . .
# . . . #
`,
    ],
    [
      "Don't skip when overwriting",
      `
# C>B . #
. . . . .
. . # . .
. . . . .
# . . . #
`,
      (g) => Crossword.keypress(g, "A"),
      `
# A B>. #
. . . . .
. . # . .
. . . . .
# . . . #
`,
    ],
    [
      "insert at end of word",
      `
# A B .>#
. . . . .
. . # . .
. . . . .
# . . . #
`,
      (g) => Crossword.keypress(g, "C"),
      `
# A B C #
.>. . . .
. . # . .
. . . . .
# . . . #
`,
    ],
    [
      "overwrite at end of word",
      `
# A B C>#
. . . . .
. . # . .
. . . . .
# . . . #
`,
      (g) => Crossword.keypress(g, "D"),
      `
# A B D>#
. . . . .
. . # . .
. . . . .
# . . . #
`,
    ],
    [
      "Delete at cursor",
      `
# A B>. #
. . . . .
. . # . .
. . . . .
# . . . #
`,
      Crossword.deleteKey,
      `
# A .>. #
. . . . .
. . # . .
. . . . .
# . . . #
`,
    ],
    [
      "Delete before cursor",
      `
# A .>. #
. . . . .
. . # . .
. . . . .
# . . . #
`,
      Crossword.deleteKey,
      `
# .>. . #
. . . . .
. . # . .
. . . . .
# . . . #
`,
    ],
    [
      "Delete at start of word",
      `
# A B C #
.>. . . .
. . # . .
. . . . .
# . . . #
`,
      Crossword.deleteKey,
      `
# A B .>#
. . . . .
. . # . .
. . . . .
# . . . #
`,
    ],
    [
      "Delete at 1a",
      `
# .>B C #
. . . . .
. . # . .
. . D . .
# . E . #
`,
      Crossword.deleteKey,
      `
# . B C #
. . . . .
. . # . .
. . D . .
# . .v. #
`,
    ],
    [
      "Reveal word",
      `
# .>. . #
. . . . .
. . # . .
. . . . .
# . . . #
`,
      (g) => Crossword.revealAnswers(g, Crossword.Target.WORD),
      `
# X>X X #
. . . . .
. . # . .
. . . . .
# . . . #
`,
    ],
    [
      "Reveal square",
      `
# A .>C #
. . . . .
. . # . .
. . . . .
# . . . #
`,
      (g) => Crossword.revealAnswers(g, Crossword.Target.SQUARE),
      `
# A X>C #
. . . . .
. . # . .
. . . . .
# . . . #
`,
    ],
    [
      "Reveal square overwrite",
      `
# A B(X)>C #
. . . . .
. . # . .
. . . . .
# . . . #
`,
      (g) => Crossword.revealAnswers(g, Crossword.Target.SQUARE),
      `
# A X>C #
. . . . .
. . # . .
. . . . .
# . . . #
`,
    ],
    [
      "Next blank moves to the start of the following clue",
      `
# . .>. #
. . . . .
. . # . .
. . . . .
# . . . #
`,
      (g) => Crossword.nextBlank(g),
      `
# . . . #
.>. . . .
. . # . .
. . . . .
# . . . #
`,
    ],
    [
      "Next blank skips filled words and lands on the first blank",
      `
# . .>. #
A B C D E
. F . . .
. . . . .
# . . . #
`,
      (g) => Crossword.nextBlank(g),
      `
# . . . #
A B C D E
.>F . . .
. . . . .
# . . . #
`,
    ],
    [
      "Next blank continues from the last across into the first down",
      `
# . . . #
. . . . .
. . # . .
. . . . .
# . .>. #
`,
      (g) => Crossword.nextBlank(g),
      `
# .v. . #
. . . . .
. . # . .
. . . . .
# . . . #
`,
    ],
    [
      "Previous blank moves to the start of the preceding clue",
      `
# . . . #
. .>. . .
. . # . .
. . . . .
# . . . #
`,
      (g) => Crossword.nextBlank(g, true),
      `
# .>. . #
. . . . .
. . # . .
. . . . .
# . . . #
`,
    ],
    [
      "Previous blank wraps from the first across to the last down",
      `
# .>. . #
. . . . .
. . # . .
. . . . .
# . . . #
`,
      (g) => Crossword.nextBlank(g, true),
      `
# . . . #
. . . . .
. . # . .
. . .v. .
# . . . #
`,
    ],
  ];
  testCases.forEach(([name, before, op, after], i) => {
    it(`${name} [index: ${i}]`, () => {
      const g_before = parseGame(before);
      const g_after = parseGame(after);
      expect(formatGame(g_before).trim()).toEqual(
        before.replace(/\(.\)/g, "").trim()
      );

      const xformed = Crossword.withUpdate(g_before, op(g_before));
      expect(formatGame(xformed)).toEqual(formatGame(g_after));
    });
  });
});

// A 4x4 barred grid with no blocks:
//
//   . . | . .
//   . . . .
//   ---
//   . . . .
//   . . . .
//
// so 1-Across is the first two cells of row 0, and 1-Down is the
// first two cells of column 0. (0,2) starts a 2-cell across word,
// (2,0) a 2-cell down word.
describe("barred grids", () => {
  const bars: Bars = { right: [[0, 1]], bottom: [[1, 0]] };
  const testCases: [
    string,
    string,
    (g: Crossword.Game) => Crossword.GameUpdate,
    string,
  ][] = [
    [
      "numbering stops at bars",
      `
.>. . .
. . . .
. . . .
. . . .
`,
      () => ({}),
      `
.>. . .
. . . .
. . . .
. . . .
`,
    ],
    [
      "typing at the end of a word wraps instead of crossing a bar",
      `
. .>. .
. . . .
. . . .
. . . .
`,
      (g) => Crossword.keypress(g, "A"),
      `
.>A . .
. . . .
. . . .
. . . .
`,
    ],
    [
      "a filled word ends at a bar",
      `
A .v. .
B . . .
. . . .
. . . .
`,
      (g) => Crossword.keypress(g, "C"),
      `
A C . .
B .v. .
. . . .
. . . .
`,
    ],
    [
      "typing down stops at a bar and moves to the next clue",
      `
A . . .
.v. . .
. . . .
. . . .
`,
      (g) => Crossword.keypress(g, "B"),
      `
A .v. .
B . . .
. . . .
. . . .
`,
    ],
    [
      "overwriting at the end of a word stays put",
      `
A B>. .
. . . .
. . . .
. . . .
`,
      (g) => Crossword.keypress(g, "C"),
      `
A C>. .
. . . .
. . . .
. . . .
`,
    ],
  ];
  testCases.forEach(([name, before, op, after], i) => {
    it(`${name} [index: ${i}]`, () => {
      const g_before = parseGame(before, bars);
      const g_after = parseGame(after, bars);
      const xformed = Crossword.withUpdate(g_before, op(g_before));
      expect(formatGame(xformed)).toEqual(formatGame(g_after));
    });
  });

  it("numbers words by bars", () => {
    const g = parseGame(
      `
.>. . .
. . . .
. . . .
. . . .
`,
      bars
    );
    const at = (row: number, column: number) =>
      Crossword.cellAt(g.puzzle, { row, column }) as Types.LetterCell;
    expect(at(0, 1).clueAcross).toEqual(1);
    expect(at(0, 2).clueAcross).not.toEqual(1);
    expect(at(1, 0).clueDown).toEqual(1);
    expect(at(2, 0).clueDown).not.toEqual(1);
  });
});

describe("applying remote updates", () => {
  const template = `
# .>. . #
. . . . .
. . # . .
. . . . .
# . . . #
`;
  const pos = { row: 0, column: 1 };
  const index = 1;

  function remoteWrite(clock: number, fill: string) {
    return create(FillSchema, {
      clock: BigInt(clock),
      nodes: ["remote"],
      cells: [{ index, clock: BigInt(clock), owner: 0, fill }],
    });
  }

  // The canonical fill as the server would broadcast it on completion:
  // every white square solved, with the complete flag set.
  function serverCompleteFill(g: Crossword.Game) {
    return create(FillSchema, {
      complete: true,
      clock: BigInt(1),
      nodes: ["server"],
      cells: g.puzzle.squares.flatMap((sq, i) =>
        sq.black
          ? []
          : [{ index: i, clock: BigInt(1), owner: 0, fill: sq.fill }]
      ),
    });
  }

  it("keeps a revealed cell over a higher-clock remote write", () => {
    let g = parseGame(template);
    g = Crossword.withUpdate(
      g,
      Crossword.revealAnswers(g, Crossword.Target.SQUARE)
    );
    expect(Crossword.fillAt(g, pos)).toMatchObject({
      fill: "X",
      checked: Types.Checked.RIGHT,
    });

    g = Crossword.withUpdate(g, { fill: remoteWrite(100, "Z") });
    expect(Crossword.fillAt(g, pos)).toMatchObject({
      fill: "X",
      checked: Types.Checked.RIGHT,
    });
  });

  it("does not clobber a concurrent remote correction when checking", () => {
    let g = parseGame(template);
    g = Crossword.withUpdate(g, Crossword.fillSquare(g, "B"));

    // The check is computed before the remote write arrives, but applied
    // after it — i.e. the two are concurrent. The remote correction must
    // win; the check may not re-assert the stale "B".
    const check = Crossword.checkAnswers(g, Crossword.Target.SQUARE);
    g = Crossword.withUpdate(g, { fill: remoteWrite(100, "Z") });
    g = Crossword.withUpdate(g, check);

    const fill = Crossword.fillAt(g, pos);
    expect(fill).toMatchObject({ fill: "Z", didCheck: true });
    expect(fill?.checked).toBeUndefined();
  });

  it("adopts a server-completed fill wholesale", () => {
    let g = parseGame(template);
    // A local wrong write with a clock far ahead of the server's fill:
    // the complete fill must still win wholesale.
    g = Crossword.withUpdate(g, Crossword.fillSquare(g, "Z"));
    expect(Crossword.fillAt(g, pos)).toMatchObject({ fill: "Z" });

    g = Crossword.withUpdate(g, { fill: serverCompleteFill(g) });
    expect(g.fillProto.complete).toBe(true);
    expect(Crossword.isSolved(g)).toBe(true);
    expect(g.nextError).toBeUndefined();
    expect(Crossword.fillAt(g, pos)).toMatchObject({ fill: "X" });
  });

  it("freezes local edits once the fill is complete", () => {
    let g = parseGame(template);
    g = Crossword.withUpdate(g, { fill: serverCompleteFill(g) });
    expect(Crossword.isSolved(g)).toBe(true);

    g = Crossword.withUpdate(g, Crossword.fillSquare(g, "Q"));
    expect(Crossword.fillAt(g, pos)).toMatchObject({ fill: "X" });
    expect(g.fillProto.complete).toBe(true);
  });

  it("clears a checked-wrong mark when a remote write wins", () => {
    let g = parseGame(template);
    g = Crossword.withUpdate(g, Crossword.fillSquare(g, "B"));
    g = Crossword.withUpdate(
      g,
      Crossword.checkAnswers(g, Crossword.Target.SQUARE)
    );
    expect(Crossword.fillAt(g, pos)).toMatchObject({
      fill: "B",
      checked: Types.Checked.WRONG,
      didCheck: true,
    });

    g = Crossword.withUpdate(g, { fill: remoteWrite(100, "Z") });
    const fill = Crossword.fillAt(g, pos);
    expect(fill).toMatchObject({ fill: "Z", didCheck: true });
    expect(fill?.checked).toBeUndefined();
  });
});
