import React from "react";

import * as Crossword from "../crossword";
import * as Types from "../types";

import { PuzzleCell, PuzzleCellProps } from "./puzzle_cell";

export interface PuzzleGridProps {
  game: Crossword.Game;
  showCursor?: boolean;
  // The game is solved: the grid is frozen, but the cursor stays live
  // so players can browse the finished puzzle.
  complete?: boolean;

  onClickCell: (arg: Types.Position) => void;
  onInput: (arg: string) => void;
}

export class PuzzleGrid extends React.Component<PuzzleGridProps> {
  activeCell: React.RefObject<PuzzleCell | null>;

  constructor(props: PuzzleGridProps) {
    super(props);
    this.activeCell = React.createRef();

    this.onClick = this.onClick.bind(this);
  }

  onClick(evt: React.MouseEvent<HTMLDivElement>) {
    if (!this.props.showCursor) {
      return;
    }
    const target = evt.currentTarget;
    const row = parseInt(target.dataset.row as string, 10);
    const column = parseInt(target.dataset.column as string, 10);
    this.props.onClickCell({ row: row, column: column });
  }

  render() {
    const active_cell = Crossword.selectedSquare(this.props.game);
    const cells: React.JSX.Element[] = [];
    for (let r = 0; r < this.props.game.puzzle.height; r++) {
      for (let c = 0; c < this.props.game.puzzle.width; c++) {
        const cell = Crossword.cellAt(this.props.game.puzzle, {
          row: r,
          column: c,
        });
        const props: PuzzleCellProps & {
          ref?: React.RefObject<PuzzleCell | null>;
        } = {
          square: cell,
          onClick: this.onClick,
          row: r,
          column: c,
        };
        if (this.props.showCursor && !cell.black) {
          if (
            r === this.props.game.cursor.row &&
            c === this.props.game.cursor.column
          ) {
            props.inword = Types.InWord.SELECTED;
            props.ref = this.activeCell;
            props.onInput = this.props.onInput;
          } else if (
            cell.clueAcross > 0 &&
            cell.clueAcross === active_cell.clueAcross
          ) {
            props.inword =
              this.props.game.cursor.direction === Types.Direction.ACROSS
                ? Types.InWord.IN_WORD
                : Types.InWord.OTHER_WORD;
          } else if (
            cell.clueDown > 0 &&
            cell.clueDown === active_cell.clueDown
          ) {
            props.inword =
              this.props.game.cursor.direction === Types.Direction.DOWN
                ? Types.InWord.IN_WORD
                : Types.InWord.OTHER_WORD;
          }
          props.fill = Crossword.fillAt(this.props.game, { row: r, column: c });
        }

        cells.push(<PuzzleCell key={`${r},${c}`} {...props} />);
      }
    }

    // Custom properties aren't part of React.CSSProperties, so the cast is
    // what lets the grid read its dimensions out of CSS.
    const style = {
      "--puzzle-cols": this.props.game.puzzle.width,
      "--puzzle-rows": this.props.game.puzzle.height,
    } as React.CSSProperties;

    // Typing isn't handled here: keystrokes from a physical keyboard
    // arrive via a window-level listener in PuzzleComponent, and touch
    // devices get the on-screen Keyboard. The grid only takes input
    // from the active cell's own rebus box.
    return (
      <div
        id="puzzlegrid"
        className={this.props.complete ? "complete" : undefined}
        style={style}
      >
        {cells}
      </div>
    );
  }
}
