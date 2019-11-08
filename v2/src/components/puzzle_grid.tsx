import React from "react";

import * as Crossword from "../crossword";
import * as Types from "../types";

import { PuzzleCell, PuzzleCellProps, InWord } from "./puzzle_cell";

export interface PuzzleGridProps {
  game: Crossword.Game;

  onClickCell: (arg: Types.Position) => void;
  onInput: (arg: string) => void;
}

export class PuzzleGrid extends React.Component<PuzzleGridProps> {
  inputRef: React.RefObject<HTMLInputElement>;
  activeCell: React.RefObject<PuzzleCell>;

  constructor(props: PuzzleGridProps) {
    super(props);
    this.inputRef = React.createRef();
    this.activeCell = React.createRef();

    this.onClick = this.onClick.bind(this);
    this.onInput = this.onInput.bind(this);
  }

  computeWidth(): number {
    return this.props.game.puzzle.width * 31 + 10;
  }

  onClick(evt: React.MouseEvent<HTMLDivElement>) {
    const target = evt.currentTarget as HTMLDivElement;
    (window as any).clickTarget = target;
    const row = parseInt(target.dataset.row as string, 10);
    const column = parseInt(target.dataset.column as string, 10);
    this.props.onClickCell({ row: row, column: column });
  }

  onInput(e: React.FormEvent<HTMLInputElement>) {
    const target = e.target as HTMLInputElement;
    const fill = target.value.toUpperCase();
    this.props.onInput(fill);
    target.value = "";
    e.preventDefault();
  }

  componentDidMount() {
    if (this.inputRef.current) {
      this.inputRef.current.focus();
    }
  }

  componentDidUpdate() {
    if (this.inputRef.current) {
      this.inputRef.current.focus();
    }
  }

  render() {
    const active_cell = Crossword.selectedSquare(this.props.game);
    const rows: JSX.Element[] = [];
    for (let r = 0; r < this.props.game.puzzle.height; r++) {
      const cells: JSX.Element[] = [];
      for (let c = 0; c < this.props.game.puzzle.width; c++) {
        const cell = Crossword.cellAt(this.props.game.puzzle, {
          row: r,
          column: c
        });
        const props: PuzzleCellProps & { ref?: React.RefObject<PuzzleCell> } = {
          square: cell,
          onClick: this.onClick,
          row: r,
          column: c
        };
        if (!cell.black) {
          if (
            r === this.props.game.cursor.row &&
            c === this.props.game.cursor.column
          ) {
            props.inword = InWord.SELECTED;
            props.ref = this.activeCell;
            props.onInput = this.props.onInput;
          } else if (cell.clueAcross === active_cell.clueAcross) {
            props.inword =
              this.props.game.cursor.direction === Types.Direction.ACROSS
                ? InWord.IN_WORD
                : InWord.OTHER_WORD;
          } else if (cell.clueDown === active_cell.clueDown) {
            props.inword =
              this.props.game.cursor.direction === Types.Direction.DOWN
                ? InWord.IN_WORD
                : InWord.OTHER_WORD;
          }
          props.fill = Crossword.fillAt(this.props.game, { row: r, column: c });
        }

        cells.push(<PuzzleCell key={`${r},${c}`} {...props} />);
      }
      rows.push(
        <div className="row" key={r}>
          {cells}
        </div>
      );
    }

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
          onInput={this.onInput}
          ref={this.inputRef}
        />
        {rows}
      </div>
    );
  }
}
