import * as Types from "./types";
import { List } from "immutable";
import { create } from "@bufbuild/protobuf";
import {
  Fill as FillProto,
  FillSchema,
  Fill_CellSchema,
  Fill_Flags,
} from "./pb/fill_pb";
import { merge } from "./crdt/merge";

type Fill = List<Readonly<Types.FillState> | undefined>;

export interface MutableGame {
  by_clue: Readonly<{ [clue: number]: Types.Position }>;
  puzzle: Readonly<Types.Puzzle>;
  cursor: Readonly<Types.Cursor>;
  // The canonical CRDT state. All updates -- local edits and deltas
  // from the server alike -- are applied by CRDT-merging them in.
  fillProto: FillProto;
  // View-model derived from fillProto; never mutated directly.
  fill: Fill;

  nextError?: number;
  clock: number;
  nodeID: string;
}

export type Game = Readonly<MutableGame>;

interface MutableGameUpdate {
  cursor?: Readonly<Types.CursorUpdate>;
  fill?: FillProto;
}

export type GameUpdate = Readonly<MutableGameUpdate>;

function packIndex(p: Types.Puzzle, pos: Types.Position): number {
  return pos.row * p.width + pos.column;
}

function unpackIndex(p: Types.Puzzle, idx: number): Types.Position {
  const row = Math.floor(idx / p.width);
  const column = idx % p.width;
  return { row, column };
}

export function cellAt(p: Types.Puzzle, pos: Types.Position): Types.Cell {
  return p.squares[packIndex(p, pos)];
}

const HEX = "0123456789abcdef";

function newId(): string {
  const buf = new Uint8Array(8);
  window.crypto.getRandomValues(buf);
  let s = "";
  buf.forEach((b) => {
    s += HEX[b >> 4];
    s += HEX[b & 0xf];
  });
  return s;
}

export function newGame(puzzle: Types.Puzzle, nodeID?: string): Game {
  const by_clue: { [clue: number]: Types.Position } = {};
  puzzle.squares.forEach((sq, idx) => {
    if (!sq.black && sq.number) {
      const pos = unpackIndex(puzzle, idx);
      by_clue[sq.number] = pos;
    }
  });

  const idx = puzzle.squares.findIndex((el) => !el.black);
  const { row, column } = unpackIndex(puzzle, idx);

  return {
    by_clue,
    puzzle,
    cursor: {
      row,
      column,
      direction: Types.Direction.ACROSS,
      pencil: false,
    },
    nextError: idx,
    fillProto: create(FillSchema, {}),
    fill: List(),
    nodeID: nodeID || newId(),
    clock: 0,
  };
}

export function fillAt(
  game: Game,
  position: Types.Position
): Readonly<Types.FillState> | undefined {
  return game.fill.get(packIndex(game.puzzle, position));
}

export function withCursor(
  g: Game,
  update: Readonly<Types.CursorUpdate>
): Game {
  if (update.row && (update.row < 0 || update.row >= g.puzzle.height)) {
    throw new Error(`bad cursor: row=${update.row}`);
  }
  if (update.column && (update.column < 0 || update.column >= g.puzzle.width)) {
    throw new Error(`bad cursor: column=${update.column}`);
  }

  return {
    ...g,
    cursor: {
      ...g.cursor,
      ...update,
    },
  };
}

function errorAt(g: Game, i: number): boolean {
  const sq = g.puzzle.squares[i];
  if (sq.black) {
    return false;
  }
  const fill = g.fill.get(i);
  if (!fill || fill.fill !== sq.fill) {
    return true;
  }

  return false;
}

function check(g: MutableGame): MutableGame {
  if (g.nextError === undefined) {
    return g;
  }
  for (let i = g.nextError; i < g.puzzle.squares.length; i++) {
    if (errorAt(g, i)) {
      g.nextError = i;
      return g;
    }
  }
  for (let i = 0; i < g.nextError; i++) {
    if (errorAt(g, i)) {
      g.nextError = i;
      return g;
    }
  }
  g.nextError = undefined;
  return g;
}

export function withFills(g: Game, fill: (string | undefined)[][]): Game {
  if (fill.length !== g.puzzle.height) {
    throw new Error("bad fill length");
  }
  if (fill.find((row) => row.length !== g.puzzle.width)) {
    throw new Error("bad fill entry");
  }
  const delta = create(FillSchema, {
    clock: BigInt(g.clock),
    nodes: [g.nodeID],
  });
  fill.forEach((row, r) => {
    row.forEach((ch, c) => {
      if (ch) {
        delta.cells.push(
          create(Fill_CellSchema, {
            index: packIndex(g.puzzle, { row: r, column: c }),
            clock: BigInt(g.clock),
            owner: 0,
            fill: ch,
            flags: g.cursor.pencil ? Fill_Flags.PENCIL : Fill_Flags.NONE,
          })
        );
      }
    });
  });
  return withUpdate(g, { fill: delta });
}

function sameFillState(
  a: Readonly<Types.FillState>,
  b: Readonly<Types.FillState>
): boolean {
  return (
    a.fill === b.fill &&
    a.pencil === b.pencil &&
    a.clock === b.clock &&
    a.owner === b.owner &&
    a.checked === b.checked &&
    a.didCheck === b.didCheck &&
    a.didReveal === b.didReveal
  );
}

// fillView derives the view-model from the canonical CRDT state. Cells
// whose state is unchanged from `old` keep their object identity, so
// that PuzzleCell's shallow prop compare skips re-rendering them.
function fillView(fill: FillProto, old: Fill): Fill {
  const cells: (Readonly<Types.FillState> | undefined)[] = [];
  fill.cells.forEach((cell) => {
    const state: Types.FillState = {
      fill: cell.fill,
      pencil: (cell.flags & Fill_Flags.PENCIL) !== 0,
      // Clocks are int64 on the wire, and so `bigint` here; the game's
      // own clock is a plain number.
      clock: Number(cell.clock),
      owner: fill.nodes[cell.owner],
    };
    if ((cell.flags & Fill_Flags.CHECKED_RIGHT) !== 0) {
      state.checked = Types.Checked.RIGHT;
    } else if ((cell.flags & Fill_Flags.CHECKED_WRONG) !== 0) {
      state.checked = Types.Checked.WRONG;
    }
    if ((cell.flags & Fill_Flags.DID_CHECK) !== 0) {
      state.didCheck = true;
    }
    if ((cell.flags & Fill_Flags.DID_REVEAL) !== 0) {
      state.didReveal = true;
    }
    const prev = old.get(cell.index);
    cells[cell.index] = prev && sameFillState(prev, state) ? prev : state;
  });
  return List(cells);
}

export function withUpdate(g: Game, update: GameUpdate): Game {
  let out = g;
  if (update.cursor) {
    out = withCursor(out, update.cursor);
  }
  if (update.fill && g.nextError !== undefined) {
    const merged = merge(g.fillProto, update.fill);
    const clock = Math.max(g.clock, Number(update.fill.clock)) + 1;
    return check({
      ...out,
      clock: clock,
      fillProto: merged,
      fill: fillView(merged, g.fill),
    });
  }
  return out;
}

function directionToDelta(direction: Types.Direction): {
  dr: number;
  dc: number;
} {
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

export function swapDirection(g: Game): GameUpdate {
  return {
    cursor: {
      direction: otherDirection(g.cursor.direction),
    },
  };
}

export function withPencil(_: Game, pencil: boolean): GameUpdate {
  return { cursor: { pencil: pencil } };
}

export function selectedSquare(g: Game): Types.LetterCell {
  const cell = cellAt(g.puzzle, g.cursor);
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
    const cell = cellAt(g.puzzle, pos);
    if (predicate({ ...pos }, cell)) {
      return pos;
    }
    pos.row += dr;
    pos.column += dc;
  }
}

export function move(
  g: Game,
  dr: number,
  dc: number,
  inword?: boolean
): GameUpdate {
  const direction = dr ? Types.Direction.DOWN : Types.Direction.ACROSS;

  const row = g.cursor.row;
  const col = g.cursor.column;

  const sel = selectedSquare(g);
  const dst = find(g, { row: row + dr, column: col + dc }, dr, dc, (_, sq) => {
    if (sq.black) {
      return false;
    }
    if (
      inword &&
      ((dc && sel.clueAcross !== sq.clueAcross) ||
        (dr && sel.clueDown !== sq.clueDown))
    ) {
      return false;
    }
    return true;
  });

  if (!dst) return {};
  return { cursor: { ...dst, direction } };
}

export function selectSquare(g: Game, pos: Types.Position): GameUpdate {
  const cell = cellAt(g.puzzle, pos);
  if (!cell || cell.black) {
    return {};
  }
  return { cursor: pos };
}

export function selectClue(
  g: Game,
  { number, direction }: Types.SelectClueEvent
): GameUpdate {
  const pos = g.by_clue[number];
  if (pos) {
    return { cursor: { ...pos, direction } };
  }
  return {};
}

export function fillSquare(
  g: Game,
  text: string,
  at?: Types.Position
): GameUpdate {
  const key = packIndex(g.puzzle, at || g.cursor);
  const fill = g.fill.get(key);
  if (fill && fill.checked === Types.Checked.RIGHT) {
    return {};
  }
  const update = create(FillSchema, {
    clock: BigInt(g.clock + 1),
    nodes: [g.nodeID],
    cells: [
      {
        index: key,
        clock: BigInt(g.clock + 1),
        owner: 0,
        fill: text.replace(/\s/, ""),
        flags: g.cursor.pencil ? Fill_Flags.PENCIL : Fill_Flags.NONE,
      },
    ],
  });
  return {
    fill: update,
  };
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
    const fill = g.fill.get(packIndex(g.puzzle, pos));
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
    const fill = g.fill.get(packIndex(g.puzzle, pos));
    return !fill || fill.fill === "";
  });
  if (found && cellAt(g.puzzle, found).black) {
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
): GameUpdate {
  const direction = g.cursor.direction;
  const firstClue =
    direction === Types.Direction.DOWN
      ? selectedSquare(g).clueDown
      : selectedSquare(g).clueAcross;
  const clues = cluesForDirection(g, direction);
  const otherClues = cluesForDirection(g, otherDirection(direction));
  const activeIndex = clues.findIndex((c) => c.number === firstClue);
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
        toIndex: 0,
      });
    }
    search.push({
      direction: otherDirection(direction),
      clues: otherClues,
      fromIndex: otherClues.length - 1,
      toIndex: 0,
    });
    search.push({
      direction,
      clues,
      fromIndex: clues.length - 1,
      toIndex: activeIndex,
    });
  } else {
    if (activeIndex < clues.length - 1) {
      search.push({
        direction,
        clues,
        fromIndex: activeIndex + 1,
        toIndex: clues.length - 1,
      });
    }
    search.push({
      direction: otherDirection(direction),
      clues: otherClues,
      fromIndex: 0,
      toIndex: otherClues.length - 1,
    });
    search.push({
      direction,
      clues,
      fromIndex: 0,
      toIndex: activeIndex,
    });
  }

  for (let i = 0; i < search.length; i++) {
    const sq = findClue(search[i], pred);
    if (sq) {
      return { cursor: { direction: search[i].direction, ...sq } };
    }
  }

  return {};
}

export function nextBlank(g: Game, reverse?: boolean): GameUpdate {
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

export function keypress(g: Game, text: string): GameUpdate {
  const oldFill = fillAt(g, g.cursor);
  const update = fillSquare(g, text);
  const cursor = g.cursor;

  const { dr, dc } = directionToDelta(g.cursor.direction);

  if (oldFill && oldFill.fill !== "") {
    return { ...update, ...move(g, dr, dc, true) };
  }

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
      const fill = g.fill.get(packIndex(g.puzzle, pos));
      if (!fill || fill.fill === "") {
        return true;
      }
      return false;
    }
  );
  if (next && !cellAt(g.puzzle, next).black) {
    return { ...update, cursor: next };
  }
  // At end-of-word, try wrapping to the beginning
  // TODO(pref): this.state.profile.settingEndWordBack
  const first = lastBlankInWord(g, cursor, -dr, -dc);
  if (
    first &&
    !(first.column === g.cursor.column && first.row === g.cursor.row)
  ) {
    return { ...update, cursor: first };
  }

  // This word is done; let's find the next one
  // TODO(pref): this.state.profile.settingEndWordNext
  return { ...update, ...nextBlank(g) };
}

export function deleteKey(g: Game): GameUpdate {
  const selected = fillAt(g, g.cursor);
  if (selected && selected.fill !== "") {
    return fillSquare(g, "");
  }
  const { dr, dc } = directionToDelta(g.cursor.direction);
  let update = move(g, -dr, -dc, true);
  if (
    !update.cursor ||
    (update.cursor.row === g.cursor.row &&
      update.cursor.column === g.cursor.column)
  ) {
    // Start of word, move backwards one clue
    update = nextClue(
      g,
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
  const cursor = { ...g.cursor, ...(update.cursor || {}) };
  return { ...update, ...fillSquare(g, "", cursor) };
}

export enum Target {
  SQUARE = "square",
  WORD = "word",
  PUZZLE = "puzzle",
}

function eachTarget(
  g: Game,
  target: Target,
  cb: (
    idx: number,
    sq: Readonly<Types.LetterCell>,
    fill?: Readonly<Types.FillState>
  ) => void
): void {
  if (target === Target.SQUARE) {
    const fill = fillAt(g, g.cursor);
    cb(packIndex(g.puzzle, g.cursor), selectedSquare(g), fill);
    return;
  }
  const active = selectedSquare(g);
  const want: (sq: Types.LetterCell) => boolean =
    target === Target.PUZZLE
      ? () => true
      : (sq) => {
          if (g.cursor.direction === Types.Direction.ACROSS) {
            return sq.clueAcross === active.clueAcross;
          } else {
            return sq.clueDown === active.clueDown;
          }
        };
  g.puzzle.squares.forEach((sq, i) => {
    if (sq.black || !want(sq)) {
      return;
    }
    const fill = g.fill.get(i);
    cb(i, sq, fill);
  });
}

export function checkAnswers(g: Game, target: Target): GameUpdate {
  // A check is a read-only annotation: each cell in the delta carries its
  // existing (fill, clock, owner) unchanged, plus the check flags. At the
  // same clock the merge tie-breaks in the delta's favor, applying the
  // flags — but a concurrent write with a fresher clock wins the clock
  // comparison, so checking never needlessly clobbers another player's
  // edit. A cell checked *correct* still beats concurrent writes, via the
  // merge's CHECKED_RIGHT rule — that clobbering is by design.
  const newfill = create(FillSchema, {
    clock: BigInt(g.clock + 1),
  });
  const update: MutableGameUpdate = { fill: newfill };
  const nodes: { [id: string]: number } = {};

  eachTarget(g, target, (idx, sq, fill) => {
    if (!fill || fill.fill === "") {
      return;
    }
    let flags: number = Fill_Flags.DID_CHECK;
    if (fill.pencil) {
      flags |= Fill_Flags.PENCIL;
    }
    if (fill.fill === sq.fill) {
      flags |= Fill_Flags.CHECKED_RIGHT;
    } else {
      flags |= Fill_Flags.CHECKED_WRONG;
      if (!update.cursor) {
        const pos = unpackIndex(g.puzzle, idx);
        update.cursor = pos;
      }
    }
    let owner = nodes[fill.owner];
    if (owner === undefined) {
      owner = newfill.nodes.length;
      nodes[fill.owner] = owner;
      newfill.nodes.push(fill.owner);
    }
    newfill.cells.push(
      create(Fill_CellSchema, {
        index: idx,
        fill: fill.fill,
        clock: BigInt(fill.clock),
        owner,
        flags,
      })
    );
  });
  return update;
}

export function revealAnswers(g: Game, target: Target): GameUpdate {
  const newfill = create(FillSchema, {
    clock: BigInt(g.clock + 1),
    nodes: [g.nodeID],
  });
  const update: GameUpdate = { fill: newfill };

  eachTarget(g, target, (idx, sq) => {
    newfill.cells.push(
      create(Fill_CellSchema, {
        index: idx,
        fill: sq.fill,
        clock: BigInt(g.clock + 1),
        owner: 0,
        flags: Fill_Flags.DID_REVEAL | Fill_Flags.CHECKED_RIGHT,
      })
    );
  });
  return update;
}
