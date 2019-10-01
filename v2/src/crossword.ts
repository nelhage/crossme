import * as Types from "./types";
import { Map, ValueObject } from "immutable";
import * as Immutable from "immutable";

class FillKey implements ValueObject {
  readonly row: number;
  readonly column: number;

  constructor(props: Types.Position) {
    this.row = props.row;
    this.column = props.column;
  }

  equals(other: any): boolean {
    if (other instanceof FillKey) {
      return this.row === other.row && this.column === other.column;
    }
    return false;
  }

  hashCode(): number {
    return ((Immutable.hash(this.row) << 3) ^ Immutable.hash(this.column)) | 0;
  }
}

type Fill = Map<FillKey, Types.FillState>;

export interface Game {
  readonly puzzle: Types.Puzzle;
  readonly cursor: Types.Cursor;
  readonly fill: Fill;
}

export function newGame(puzzle: Types.Puzzle): Game {
  return {
    puzzle,
    // TODO: detect first blank square
    cursor: {
      row: 1,
      column: 2,
      direction: Types.Direction.DOWN
    },
    fill: Map()
  };
}

export function fillAt(
  game: Game,
  position: Types.Position
): Types.FillState | undefined {
  return game.fill.get(new FillKey(position));
}

function withCursor(g: Game, update: Types.CursorUpdate): Game {
  if (update.row && (update.row < 0 || update.row >= g.puzzle.width)) {
    throw new Error(`bad cursor: row=${update.row}`);
  }
  if (
    update.column &&
    (update.column < 0 || update.column >= g.puzzle.height)
  ) {
    throw new Error(`bad cursor: column=${update.column}`);
  }

  return {
    ...g,
    cursor: {
      ...g.cursor,
      ...update
    }
  };
}

function withFill(g: Game, update: (fill: Fill) => Fill): Game {
  return {
    ...g,
    fill: update(g.fill)
  };
}

function directionToDelta(
  direction: Types.Direction
): { dr: number; dc: number } {
  if (direction === Types.Direction.ACROSS) {
    return { dr: 0, dc: 1 };
  }
  return { dr: 1, dc: 0 };
}

export function swapDirection(g: Game): Game {
  return withCursor(g, {
    direction:
      g.cursor.direction === Types.Direction.ACROSS
        ? Types.Direction.DOWN
        : Types.Direction.ACROSS
  });
}

export function selectedSquare(g: Game): Types.LetterCell {
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
  predicate: (pos: Types.Position, sq: Types.Cell) => boolean
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
    const cell = g.puzzle.squares[pos.row][pos.column];
    if (predicate({ ...pos }, cell)) {
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

export function fillSquare(g: Game, text: string): Game {
  return withFill(g, fill =>
    fill.set(new FillKey({ row: g.cursor.row, column: g.cursor.column }), {
      fill: text.replace(/\s/, "")
    })
  );
}

function firstBlankInWord(
  g: Game,
  pos: Types.Position,
  dr: number,
  dc: number
): Types.Position | null {
  let prev = null;
  find(g, pos.row, pos.column, -dr, -dc, (pos, sq) => {
    if (sq.black) {
      return true;
    }
    const fill = g.fill.get(new FillKey(pos));
    if (!fill || fill.fill === "") {
      prev = pos;
    }
    return false;
  });
  return prev;
}

export function keypress(g: Game, text: string): Game {
  const out = fillSquare(g, text);
  const cursor = g.cursor;

  const { dr, dc } = directionToDelta(g.cursor.direction);
  const next = find(
    g,
    cursor.row + dr,
    cursor.column + dc,
    dr,
    dc,
    (pos, sq) => {
      if (
        sq.black /* TODO(pref): || this.state.profile.settingWithinWord !== "skip" */
      ) {
        return true;
      }
      const fill = g.fill.get(new FillKey(pos));
      if (!fill || fill.fill === "") {
        return true;
      }
      return false;
    }
  );
  if (next && !g.puzzle.squares[next.row][next.column].black) {
    return withCursor(out, next);
  }
  // At end-of-word, try wrapping to the beginning
  // TODO(pref): this.state.profile.settingEndWordBack
  const first = firstBlankInWord(out, cursor, dr, dc);
  if (first) {
    return withCursor(out, first);
  }

  return out;
}
