import React from "react";

import { Puzzle } from "../types";

import { PuzzleCell } from "./puzzle_cell";

export interface PuzzleGridProps {
  puzzle: Puzzle;
}

export class PuzzleGrid extends React.Component<PuzzleGridProps> {
  computeWidth() {
    return this.props.puzzle.width * 31 + 10;
  }

  render() {
    const rows = this.props.puzzle.squares.map((row, i) => {
      const cells = row.map((cell, c) => (
        <PuzzleCell
          key={c}
          square={cell}
          // fills={this.props.fills}
          // onClick={() => this.props.onClickCell({ row: i, column: c })}
          // delegate={this.props.delegate}
        />
      ));
      return (
        <div className="row" key={i}>
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
