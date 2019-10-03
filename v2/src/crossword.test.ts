import * as Crossword from "./crossword";
import * as Types from "./types";

function computeNumbering(grid: Types.Cell[][]): [Types.Clue[], Types.Clue[]] {
  const height = grid.length;
  const width = grid[0].length;

  const needsAcross: (row: number, column: number) => boolean = (r, c) => {
    if (c > 0 && !grid[r][c - 1].black) {
      return false;
    }
    return c + 1 !== width && !grid[r][c + 1].black;
  };
  const needsDown: (row: number, column: number) => boolean = (r, c) => {
    if (r > 0 && !grid[r - 1][c].black) {
      return false;
    }
    return r + 1 !== height && !grid[r + 1][c].black;
  };

  const across: Types.Clue[] = [];
  const down: Types.Clue[] = [];

  let n = 1;
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < height; c++) {
      const cell = grid[r][c];
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
          const sq = grid[rr][c];
          if (sq.black) {
            break;
          }
          (sq as Types.LetterCell).clue_down = n;
        }
      }
      if (needsAcross(r, c)) {
        across.push({ number: n, text: `Across clue ${n}` });
        for (let cc = c; cc < width; cc++) {
          const sq = grid[r][cc];
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
    l => l.length != lines.length * 2 && l.length != lines.length * 2 - 1
  );
  if (wrongLen) {
    throw new Error(`bad line length: '${wrongLen}'`);
  }

  const grid: Types.Cell[][] = [];
  const fill: (string | undefined)[][] = [];
  let cursor: undefined | Types.Cursor;

  lines.forEach((line, r) => {
    const cells: Types.Cell[] = [];
    const fills: (string | undefined)[] = [];
    for (let i = 0; i < line.length; i += 2) {
      const ch = line[i];
      let fill: string | undefined;
      if (ch === "#") {
        cells.push({ black: true });
      } else if (ch === ".") {
        cells.push({ black: false, fill: "X", clue_across: 0, clue_down: 0 });
      } else if (ch.match(/[A-Z]/)) {
        cells.push({ black: false, fill: ch, clue_across: 0, clue_down: 0 });
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
          if (cells[cells.length - 1].black) {
            throw new Error("selected black cell");
          }
          cursor = {
            row: r,
            column: Math.floor(i / 2),
            direction:
              line[i + 1] === ">"
                ? Types.Direction.ACROSS
                : Types.Direction.DOWN
          };
          break;
        default:
          throw new Error(`bad cursor char: '${line[i + 1]}'`);
      }
    }
    fill.push(fills);
    grid.push(cells);
  });

  if (!cursor) {
    throw new Error("no cursor found");
  }

  const [across_clues, down_clues] = computeNumbering(grid);

  const puzzle: Types.Puzzle = {
    title: "Test Puzzle",
    author: "Test Author",
    copyright: "Test Copyright",
    width: grid[0].length,
    height: grid.length,
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
  return g.puzzle.squares
    .map((row, r) => {
      row.map((sq, c) => {
        if (sq.black) {
          return "# ";
        }
        const fill = Crossword.fillAt(g, { row: r, column: c });
        if (fill && fill.fill) {
          return fill.fill + " ";
        }
        return ". ";
      });
    })
    .join("\n");
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
# A>. . #
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
    ]
  ];
  testCases.forEach(([name, before, op, after], i) => {
    it(`${name} [row: ${i}]`, () => {
      const g_before = parseGame(before);
      const g_after = parseGame(after);

      const xformed = op(g_before);
      expect(xformed.cursor).toEqual(g_after.cursor);
      expect(formatGame(xformed)).toEqual(formatGame(g_after));
    });
  });
});
