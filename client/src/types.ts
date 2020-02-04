export interface BlackCell {
  black: true;
}

export interface LetterCell {
  black: false;
  fill: string;
  number?: number;
  circled?: boolean;
  clueAcross: number;
  clueDown: number;
}

export type Cell = BlackCell | LetterCell;

export interface Clue {
  number: number;
  text: string;
}

export interface Puzzle {
  id: string;
  title: string;
  author: string;
  copyright: string;
  note?: string;
  width: number;
  height: number;
  date?: string;
  squares: Cell[];
  across_clues: Clue[];
  down_clues: Clue[];
}

export enum Direction {
  DOWN = "down",
  ACROSS = "across"
}

export interface Position {
  row: number;
  column: number;
}

export interface SelectClueEvent {
  direction: Direction;
  number: number;
}

export interface Cursor {
  readonly row: number;
  readonly column: number;
  readonly direction: Direction;
  readonly pencil: boolean;
}

export interface CursorUpdate {
  row?: number;
  column?: number;
  direction?: Direction;
  pencil?: boolean;
}

export enum Checked {
  RIGHT,
  WRONG
}

export interface FillState {
  fill: string;
  pencil: boolean;

  clock: number;
  owner: string;

  checked?: Checked;
  didCheck?: boolean;
  didReveal?: boolean;
}
