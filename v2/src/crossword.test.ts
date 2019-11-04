import * as Crossword from "./crossword";
import * as Types from "./types";

function computeNumbering(
  { width, height }: { width: number; height: number },
  grid: Types.Cell[]
): [Types.Clue[], Types.Clue[]] {
  const at: (r: number, c: number) => Types.Cell = (r, c) =>
    grid[r * width + c];
  const needsAcross: (row: number, column: number) => boolean = (r, c) => {
    if (c > 0 && !at(r, c - 1).black) {
      return false;
    }
    return c + 1 !== width && !at(r, c + 1).black;
  };
  const needsDown: (row: number, column: number) => boolean = (r, c) => {
    if (r > 0 && !at(r - 1, c).black) {
      return false;
    }
    return r + 1 !== height && !at(r + 1, c).black;
  };

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
        for (let rr = r; rr < height; rr++) {
          const sq = at(rr, c);
          if (sq.black) {
            break;
          }
          (sq as Types.LetterCell).clue_down = n;
        }
      }
      if (needsAcross(r, c)) {
        across.push({ number: n, text: `Across clue ${n}` });
        for (let cc = c; cc < width; cc++) {
          const sq = at(r, cc);
          if (sq.black) {
            break;
          }

          (sq as Types.LetterCell).clue_across = n;
        }
      }
      n += 1;
    }
  }
  return [across, down];
}

function parseGame(template: string): Crossword.Game {
  template = template.trim();
  const lines = template.split("\n");
  const wrongLen = lines.find(
    l => l.length !== lines.length * 2 && l.length !== lines.length * 2 - 1
  );
  if (wrongLen) {
    throw new Error(`bad line length: '${wrongLen}'`);
  }
  const height = lines.length;
  const width = Math.ceil(lines[0].length / 2);

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
        grid.push({ black: false, fill: "X", clue_across: 0, clue_down: 0 });
      } else if (ch.match(/[A-Z]/)) {
        grid.push({ black: false, fill: ch, clue_across: 0, clue_down: 0 });
        fill = ch;
      } else {
        throw new Error(`bad fill char: '${ch}'`);
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
            column: Math.floor(i / 2),
            direction:
              line[i + 1] === ">"
                ? Types.Direction.ACROSS
                : Types.Direction.DOWN,
            pencil: false
          };
          break;
        default:
          throw new Error(`bad cursor char: '${line[i + 1]}'`);
      }
    }
    fill.push(fills);
  });

  if (!cursor) {
    throw new Error("no cursor found");
  }

  const [across_clues, down_clues] = computeNumbering({ width, height }, grid);

  const puzzle: Types.Puzzle = {
    title: "Test Puzzle",
    author: "Test Author",
    copyright: "Test Copyright",
    width,
    height,
    squares: grid,
    across_clues: across_clues,
    down_clues: down_clues
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
      let ch = "";
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
          return ch + ">";
        } else {
          return ch + "v";
        }
      }
      row.push(ch);
    }
    rows.push(row.join(""));
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
    (g: Crossword.Game) => Crossword.Game,
    string
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
      g => Crossword.keypress(g, "A"),
      `
# A .>. #
. . . . .
. . # . .
. . . . .
# . . . #
`
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
      g => Crossword.keypress(g, "A"),
      `
# A B .>#
. . . . .
. . # . .
. . . . .
# . . . #
`
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
      g => Crossword.keypress(g, "A"),
      `
# A B>. #
. . . . .
. . # . .
. . . . .
# . . . #
`
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
      g => Crossword.keypress(g, "D"),
      `
# A B D>#
. . . . .
. . # . .
. . . . .
# . . . #
`
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
`
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
`
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
`
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
`
    ]
  ];
  testCases.forEach(([name, before, op, after], i) => {
    it(`${name} [index: ${i}]`, () => {
      const g_before = parseGame(before);
      const g_after = parseGame(after);

      const xformed = op(g_before);
      expect(formatGame(xformed)).toEqual(formatGame(g_after));
    });
  });
});
