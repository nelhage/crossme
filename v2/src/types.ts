export interface BlackCell {
  black: true;
}

export interface LetterCell {
  black: false;
  fill: string;
  clue?: number;
  circled?: boolean;
}

export type Cell = BlackCell | LetterCell;

export interface Clue {
  number: number;
  text: string;
}

export interface Puzzle {
  title: string;
  author: string;
  copyright: string;
  note?: string;
  width: number;
  height: number;
  date?: string;
  squares: Cell[][];
  across_clues: Clue[];
  down_clues: Clue[];
}

export enum Direction {
  DOWN = "down",
  ACROSS = "across"
}
