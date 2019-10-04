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
  readonly by_clue: Readonly<{ [clue: number]: Types.Position }>;
  readonly puzzle: Readonly<Types.Puzzle>;
  readonly cursor: Readonly<Types.Cursor>;
  readonly fill: Fill;
}

export function newGame(puzzle: Types.Puzzle): Game {
  const by_clue: { [clue: number]: Types.Position } = {};
  puzzle.squares.forEach((row, r) => {
    row.forEach((sq, c) => {
      if (!sq.black && sq.number) {
        by_clue[sq.number] = { row: r, column: c };
      }
    });
  });

  return {
    by_clue,
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

export function withCursor(g: Game, update: Types.CursorUpdate): Game {
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

export function withFills(g: Game, fill: (string | undefined)[][]): Game {
  if (fill.length !== g.puzzle.height) {
    throw new Error("bad fill length");
  }
  if (fill.find(row => row.length !== g.puzzle.width)) {
    throw new Error("bad fill entry");
  }
  const array: [FillKey, Types.FillState][] = [];
  fill.forEach((row, r) => {
    row.forEach((ch, c) => {
      if (ch) {
        array.push([new FillKey({ row: r, column: c }), { fill: ch }]);
      }
    });
  });
  return withFill(g, () => Map(array));
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

function otherDirection(d: Types.Direction): Types.Direction {
  return d === Types.Direction.ACROSS
    ? Types.Direction.DOWN
    : Types.Direction.ACROSS;
}

export function swapDirection(g: Game): Game {
  return withCursor(g, {
    direction: otherDirection(g.cursor.direction)
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
  start: Types.Position,
  dr: number,
  dc: number,
  predicate: (pos: Types.Position, sq: Types.Cell) => boolean
): Types.Position | null {
  const pos: Types.Position = { ...start };
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
  const dst = find(
    g,
    { row: row + dr, column: col + dc },
    dr,
    dc,
    (pos: Types.Position) => {
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
    }
  );

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
  const pos = g.by_clue[number];
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

function lastBlankInWord(
  g: Game,
  pos: Types.Position,
  dr: number,
  dc: number
): Types.Position | null {
  let prev = null;
  find(g, pos, dr, dc, (pos, sq) => {
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

function nextBlankInWord(
  g: Game,
  pos: Types.Position,
  dr: number,
  dc: number
): Types.Position | null {
  const found = find(g, pos, dr, dc, (pos, sq) => {
    if (sq.black) {
      return true;
    }
    const fill = g.fill.get(new FillKey(pos));
    return !fill || fill.fill === "";
  });
  if (found && g.puzzle.squares[found.row][found.column].black) {
    return null;
  }
  return found;
}

function cluesForDirection(g: Game, direction: Types.Direction): Types.Clue[] {
  return direction === Types.Direction.DOWN
    ? g.puzzle.down_clues
    : g.puzzle.across_clues;
}

interface clueSearch {
  direction: Types.Direction;
  clues: Types.Clue[];
  fromIndex: number;
  toIndex: number;
}

function findClue<T>(
  s: clueSearch,
  predicate: (direction: Types.Direction, clue: Types.Clue) => T | undefined
): T | undefined {
  let index = s.fromIndex;
  while (true) {
    const clue = s.clues[index];
    if (!clue) {
      throw new Error(`internal consistency error: no clue @ ${index}`);
    }
    const got = predicate(s.direction, clue);
    if (got) {
      return got;
    }
    if (index === s.toIndex) {
      return undefined;
    }
    if (index < s.toIndex) {
      index += 1;
    } else {
      index -= 1;
    }
  }
}

function nextClue(
  g: Game,
  pred: (
    direction: Types.Direction,
    clue: Types.Clue
  ) => Types.CursorUpdate | undefined,
  reverse?: boolean
): Game {
  let direction = g.cursor.direction;
  const firstClue =
    direction === Types.Direction.DOWN
      ? selectedSquare(g).clue_down
      : selectedSquare(g).clue_across;
  const clues = cluesForDirection(g, direction);
  const otherClues = cluesForDirection(g, otherDirection(direction));
  const activeIndex = clues.findIndex(c => c.number === firstClue);
  if (activeIndex < 0) {
    throw new Error(`no such clue: ${firstClue}-${direction}`);
  }

  const search: clueSearch[] = [];
  if (reverse) {
    if (activeIndex > 0) {
      search.push({
        direction,
        clues,
        fromIndex: activeIndex - 1,
        toIndex: 0
      });
    }
    search.push({
      direction,
      clues,
      fromIndex: clues.length - 1,
      toIndex: activeIndex
    });
    search.push({
      direction: otherDirection(direction),
      clues: otherClues,
      fromIndex: otherClues.length - 1,
      toIndex: 0
    });
  } else {
    if (activeIndex < clues.length - 1) {
      search.push({
        direction,
        clues,
        fromIndex: activeIndex + 1,
        toIndex: clues.length - 1
      });
    }
    search.push({
      direction,
      clues,
      fromIndex: 0,
      toIndex: activeIndex
    });
    search.push({
      direction: otherDirection(direction),
      clues: otherClues,
      fromIndex: 0,
      toIndex: otherClues.length - 1
    });
  }

  for (let i = 0; i < search.length; i++) {
    const sq = findClue(search[i], pred);
    if (sq) {
      return withCursor(g, sq);
    }
  }

  return g;
}

export function nextBlank(g: Game, reverse?: boolean): Game {
  return nextClue(
    g,
    (direction, clue) => {
      const start = g.by_clue[clue.number];
      const { dr, dc } = directionToDelta(direction);
      const found = nextBlankInWord(g, start, dr, dc);
      if (found) {
        return { ...found, direction };
      }
    },
    reverse
  );
}

export function keypress(g: Game, text: string): Game {
  const out = fillSquare(g, text);
  const cursor = g.cursor;

  const { dr, dc } = directionToDelta(g.cursor.direction);
  const next = find(
    g,
    { row: cursor.row + dr, column: cursor.column + dc },
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
  const first = lastBlankInWord(out, cursor, -dr, -dc);
  if (first) {
    return withCursor(out, first);
  }

  // This word is done; let's find the next one
  // TODO(pref): this.state.profile.settingEndWordNext
  return nextBlank(out);
}

export function deleteKey(g: Game): Game {
  let out = g;
  const selected = fillAt(g, g.cursor);
  if (selected && selected.fill !== "") {
    return fillSquare(out, "");
  }
  const { dr, dc } = directionToDelta(g.cursor.direction);
  out = move(out, -dr, -dc, true);
  if (
    out.cursor.row === g.cursor.row &&
    out.cursor.column === g.cursor.column
  ) {
    // Start of word, move backwards one clue
    out = nextClue(
      out,
      (direction, clue) => {
        const start = g.by_clue[clue.number];
        const { dr, dc } = directionToDelta(direction);
        let last = start;
        find(g, start, dr, dc, (pos, sq) => {
          if (sq.black) {
            return true;
          }
          last = pos;
          return false;
        });
        return last;
      },
      true
    );
  }
  out = fillSquare(out, "");
  return out;
}
