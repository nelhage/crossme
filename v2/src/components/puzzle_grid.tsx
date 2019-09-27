import React from "react";

import * as Types from "../types";

import { PuzzleCell, PuzzleCellProps, InWord } from "./puzzle_cell";

export interface PuzzleGridProps {
  puzzle: Types.Puzzle;
  row: number;
  column: number;
  direction: Types.Direction;
}

export class PuzzleGrid extends React.Component<PuzzleGridProps> {
  computeWidth() {
    return this.props.puzzle.width * 31 + 10;
  }

  render() {
    const active_cell = this.props.puzzle.squares[this.props.row][
      this.props.column
    ];
    if (active_cell.black) {
      throw new Error("selected black cell");
    }
    const rows = this.props.puzzle.squares.map((row, r) => {
      const cells = row.map((cell, c) => {
        const props: PuzzleCellProps = { square: cell };
        if (!cell.black) {
          if (r === this.props.row && c === this.props.column) {
            props.inword = InWord.SELECTED;
          } else if (cell.clue_across === active_cell.clue_across) {
            props.inword =
              this.props.direction == Types.Direction.ACROSS
                ? InWord.IN_WORD
                : InWord.OTHER_WORD;
          } else if (cell.clue_down == active_cell.clue_down) {
            props.inword =
              this.props.direction == Types.Direction.DOWN
                ? InWord.IN_WORD
                : InWord.OTHER_WORD;
          }
        }

        return (
          <PuzzleCell
            key={c}
            {...props}
            // fills={this.props.fills}
            // onClick={() => this.props.onClickCell({ row: i, column: c })}
            // delegate={this.props.delegate}
          />
        );
      });
      return (
        <div className="row" key={r}>
          {cells}
        </div>
      );
    });

    // In order to support mobile devices, we create an
    // off-screen <input> field, which we ensure is always focused
    // as long as the cursor is on a crossword cell. This forces
    // mobile devices to pop up a keyboard, and we then listen for
    // onInput events to catch keystrokes. We use a password field
    // because that forces a letter-by-letter keyboard and input mode,
    // avoiding potentially buffering input in the keyboard itself
    // before it hits the DOM.
    return (
      <div id="puzzlegrid">
        <meta
          name="viewport"
          content={`width=${this.computeWidth()}, user-scalable=no`}
          id="viewport-meta"
        />
        <input
          id="puzzleinput"
          defaultValue=""
          type="password"
          // onInput={this.props.onInput}
        />
        {rows}
      </div>
    );
  }
}