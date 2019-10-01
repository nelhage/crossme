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

export function fillSquare(g: Game, text: string): Game {
  return withFill(g, fill =>
    fill.set(new FillKey({ row: g.cursor.row, column: g.cursor.column }), {
      fill: text
    })
  );
}
