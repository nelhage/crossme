import * as Types from "./types";
import { List } from "immutable";
import * as FillPb from "./pb/fill_pb";

type Fill = List<Readonly<Types.FillState> | undefined>;

export interface Game {
  readonly by_clue: Readonly<{ [clue: number]: Types.Position }>;
  readonly puzzle: Readonly<Types.Puzzle>;
  readonly cursor: Readonly<Types.Cursor>;
  readonly fill: Fill;

  readonly clock: number;
  readonly nodeID: string;
}

interface MutableGameUpdate {
  cursor?: Readonly<Types.CursorUpdate>;
  fill?: Readonly<FillPb.Fill>;
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

const HEX = "012456789abcdef";

function newId(): string {
  const buf = new Uint8Array(8);
  window.crypto.getRandomValues(buf);
  let s = "";
  buf.forEach(b => {
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

  const idx = puzzle.squares.findIndex(el => !el.black);
  const { row, column } = unpackIndex(puzzle, idx);

  return {
    by_clue,
    puzzle,
    cursor: {
      row,
      column,
      direction: Types.Direction.ACROSS,
      pencil: false
    },
    fill: List(),
    nodeID: nodeID || newId(),
    clock: 0
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
  const array: Types.FillState[] = [];
  fill.forEach((row, r) => {
    row.forEach((ch, c) => {
      if (ch) {
        array[packIndex(g.puzzle, { row: r, column: c })] = {
          fill: ch,
          pencil: g.cursor.pencil,
          clock: g.clock,
          owner: g.nodeID
        };
      }
    });
  });
  return withFill(g, () => List(array));
}

function mergeFill(
  mut: List<Readonly<Types.FillState> | undefined>,
  fill: FillPb.Fill
): void {
  fill.getCellsList().forEach(cell => {
    const existing: Types.FillState = Object.assign(
      {},
      mut.get(cell.getIndex()) || {
        clock: 0,
        owner: "",
        fill: "",
        pencil: false
      }
    );
    const flags = cell.getFlags();
    if ((flags & FillPb.Fill.Flags.DID_CHECK) !== 0) {
      existing.didCheck = true;
      mut.set(cell.getIndex(), existing);
    }
    if ((flags & FillPb.Fill.Flags.DID_REVEAL) !== 0) {
      existing.didReveal = true;
      mut.set(cell.getIndex(), existing);
    }
    if (
      existing.clock > cell.getClock() ||
      (existing.clock === cell.getClock() &&
        existing.owner > fill.getNodesList()[cell.getOwner()])
    ) {
      return;
    }
    existing.pencil = (flags & FillPb.Fill.Flags.PENCIL) !== 0;
    if ((flags & FillPb.Fill.Flags.CHECKED_RIGHT) !== 0) {
      existing.checked = Types.Checked.RIGHT;
    } else if ((flags & FillPb.Fill.Flags.CHECKED_WRONG) !== 0) {
      existing.checked = Types.Checked.WRONG;
    }
    existing.fill = cell.getFill();
    existing.owner = fill.getNodesList()[cell.getOwner()];
    existing.clock = cell.getClock();
    mut.set(cell.getIndex(), existing);
  });
}

export function withUpdate(g: Game, update: GameUpdate): Game {
  let out = g;
  if (update.cursor) {
    out = withCursor(out, update.cursor);
  }
  if (update.fill) {
    let mut = g.fill.asMutable();
    const clock = Math.max(g.clock, update.fill.getClock()) + 1;
    mergeFill(mut, update.fill);
    return {
      ...out,
      clock: clock,
      fill: mut.asImmutable()
    };
  }
  return out;
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

export function swapDirection(g: Game): GameUpdate {
  return {
    cursor: {
      direction: otherDirection(g.cursor.direction)
    }
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
  const update = new FillPb.Fill();
  update.setClock(g.clock + 1);
  update.addNodes(g.nodeID);
  const sq = new FillPb.Fill.Cell();
  sq.setIndex(key);
  sq.setClock(g.clock + 1);
  sq.setOwner(0);
  sq.setFill(text.replace(/\s/, ""));
  sq.setFlags(
    g.cursor.pencil ? FillPb.Fill.Flags.PENCIL : FillPb.Fill.Flags.NONE
  );
  update.addCells(sq);
  return {
    fill: update
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
  let direction = g.cursor.direction;
  const firstClue =
    direction === Types.Direction.DOWN
      ? selectedSquare(g).clueDown
      : selectedSquare(g).clueAcross;
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
      direction: otherDirection(direction),
      clues: otherClues,
      fromIndex: otherClues.length - 1,
      toIndex: 0
    });
    search.push({
      direction,
      clues,
      fromIndex: clues.length - 1,
      toIndex: activeIndex
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
      direction: otherDirection(direction),
      clues: otherClues,
      fromIndex: 0,
      toIndex: otherClues.length - 1
    });
    search.push({
      direction,
      clues,
      fromIndex: 0,
      toIndex: activeIndex
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
  if (first) {
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
  PUZZLE = "puzzle"
}

function eachTarget(
  g: Game,
  target: Target,
  cb: (
    idx: number,
    sq: Readonly<Types.LetterCell>,
    fill: Readonly<Types.FillState>
  ) => void
): void {
  if (target === Target.SQUARE) {
    const fill = fillAt(g, g.cursor);
    if (fill) {
      cb(packIndex(g.puzzle, g.cursor), selectedSquare(g), fill);
    }
    return;
  }
  const active = selectedSquare(g);
  const want: (sq: Types.LetterCell) => boolean =
    target === Target.PUZZLE
      ? () => true
      : sq => {
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
    if (fill) {
      cb(i, sq, fill);
    }
  });
}

export function checkAnswers(g: Game, target: Target): GameUpdate {
  const newfill = new FillPb.Fill();
  newfill.setClock(g.clock + 1);
  newfill.addNodes(g.nodeID);
  const update: MutableGameUpdate = { fill: newfill };

  eachTarget(g, target, (idx, sq, fill) => {
    if (!fill || fill.fill === "") {
      return;
    }
    const newsq = new FillPb.Fill.Cell();
    newsq.setIndex(idx);
    newsq.setFill(fill.fill);
    newsq.setClock(g.clock + 1);
    newsq.setOwner(0);
    let flags: number = FillPb.Fill.Flags.DID_CHECK;
    if (fill.fill === sq.fill) {
      flags |= FillPb.Fill.Flags.CHECKED_RIGHT;
    } else {
      flags |= FillPb.Fill.Flags.CHECKED_WRONG;
      if (!update.cursor) {
        const pos = unpackIndex(g.puzzle, idx);
        update.cursor = pos;
      }
    }
    newsq.setFlags(flags);
    newfill.addCells(newsq);
  });
  return update;
}

export function revealAnswers(g: Game, target: Target): GameUpdate {
  const newfill = new FillPb.Fill();
  newfill.setClock(g.clock + 1);
  newfill.addNodes(g.nodeID);
  const update: GameUpdate = { fill: newfill };

  eachTarget(g, target, (idx, sq, fill) => {
    const newsq = new FillPb.Fill.Cell();
    newsq.setIndex(idx);
    newsq.setFill(sq.fill);
    newsq.setClock(g.clock + 1);
    newsq.setOwner(0);
    let flags: number = FillPb.Fill.Flags.DID_REVEAL;
    if (fill.fill === sq.fill) {
      flags |= FillPb.Fill.Flags.CHECKED_RIGHT;
    } else {
      flags |= FillPb.Fill.Flags.CHECKED_WRONG;
    }
    newsq.setFlags(flags);
    newfill.addCells(newsq);
  });
  return update;
}
