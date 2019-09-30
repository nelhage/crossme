import * as Types from "./types";

export interface Cursor {
  readonly row: number;
  readonly column: number;
  readonly direction: Types.Direction;
}

export interface CursorUpdate {
  readonly row?: number;
  readonly column?: number;
  readonly direction?: Types.Direction;
}

export interface Game {
  readonly puzzle: Types.Puzzle;
  readonly cursor: Cursor;
}

function withCursor(g: Game, update: CursorUpdate): Game {
  return {
    ...g,
    cursor: {
      ...g.cursor,
      ...update
    }
  };
}

export function swapDirection(g: Game): Game {
  return withCursor(g, {
    direction:
      g.cursor.direction === Types.Direction.ACROSS
        ? Types.Direction.DOWN
        : Types.Direction.ACROSS
  });
}

function selectedSquare(g: Game): Types.LetterCell {
  const cell = g.puzzle.squares[g.cursor.row][g.cursor.column];
  if (cell.black) {
    throw new Error("Selected black cell!");
  }
  return cell;
}

function find(
  g: Game,
  row: number,
  column: number,
  dr: number,
  dc: number,
  predicate: (pos: Types.Position) => boolean
): Types.Position | null {
  const pos: Types.Position = { row, column };
  while (true) {
    if (
      pos.row < 0 ||
      pos.row >= g.puzzle.height ||
      pos.column < 0 ||
      pos.column >= g.puzzle.width
    ) {
      return null;
    }
    if (predicate(pos)) {
      return pos;
    }
    pos.row += dr;
    pos.column += dc;
  }
}

export function move(g: Game, dr: number, dc: number, inword?: boolean): Game {
  const direction = dr ? Types.Direction.DOWN : Types.Direction.ACROSS;

  const row = g.cursor.row;
  const col = g.cursor.column;

  const sel = selectedSquare(g);
  const dst = find(g, row + dr, col + dc, dr, dc, (pos: Types.Position) => {
    const sq = g.puzzle.squares[pos.row][pos.column];
    if (sq.black) {
      return false;
    }
    if (
      inword &&
      ((dc && sel.clue_across !== sq.clue_across) ||
        (dr && sel.clue_down !== sq.clue_down))
    ) {
      return false;
    }
    return true;
  });

  if (!dst) return g;
  return withCursor(g, { ...dst, direction });
}

export function selectSquare(g: Game, { row, column }: Types.Position): Game {
  const cell = g.puzzle.squares[row][column];
  if (!cell || cell.black) {
    return g;
  }
  return withCursor(g, { row, column });
}

export function selectClue(
  g: Game,
  { number, direction }: Types.SelectClueEvent
): Game {
  const pos = g.puzzle.squares.find((row, r) => {
    const cell = row.find((cell, c) => {
      if (cell.black) {
        return null;
      }
      if (cell.number === number) {
        return { row: r, column: c };
      }
      return false;
    });
    return cell;
  });
  if (pos) {
    return withCursor(g, { ...pos, direction });
  }
  return g;
}
