import React from "react";

import "./style/puzzle.css";

import * as Types from "../types";

import { Metadata } from "./metadata";
import { PuzzleGrid } from "./puzzle_grid";
import { CurrentClue } from "./current_clue";
import { ClueBox } from "./clue_box";

export interface PuzzleProps {
  puzzle: Types.Puzzle;
}

export interface PuzzleState {
  row: number;
  column: number;
  direction: Types.Direction;
}

export class PuzzleComponent extends React.Component<PuzzleProps, PuzzleState> {
  constructor(props: PuzzleProps) {
    super(props);
    this.state = {
      row: 1,
      column: 2,
      direction: Types.Direction.DOWN
    };

    this.onClickCell = this.onClickCell.bind(this);
    this.onSelectClue = this.onSelectClue.bind(this);
    this.keyDown = this.keyDown.bind(this);
  }

  keyDown(e: KeyboardEvent) {
    if (e.altKey || e.ctrlKey || e.metaKey) {
      return;
    }

    switch (e.key) {
      case "ArrowRight":
        this.arrow(0, 1);
        break;
      case "ArrowLeft":
        this.arrow(0, -1);
        break;
      case "ArrowUp":
        this.arrow(-1, 0);
        break;
      case "ArrowDown":
        this.arrow(1, 0);
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  arrow(dr: number, dc: number) {
    const direction = dr ? Types.Direction.DOWN : Types.Direction.ACROSS;
    // TODO: settingArrows
    if (direction !== this.state.direction) {
      this.setState({ direction });
      return;
    }
    this.move(dr, dc);
  }

  move(dr: number, dc: number, inword?: boolean) {
    const direction = dr ? Types.Direction.DOWN : Types.Direction.ACROSS;

    const row = this.state.row;
    const col = this.state.column;

    const sel = this.selectedSquare();
    const dst = this.find(row + dr, col + dc, dr, dc, (pos: Types.Position) => {
      const sq = this.props.puzzle.squares[pos.row][pos.column];
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

    if (!dst) return;
    this.setState(Object.assign({}, dst, { direction }));
  }

  find(
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
        pos.row >= this.props.puzzle.height ||
        pos.column < 0 ||
        pos.column >= this.props.puzzle.width
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

  onClickCell({ row, column }: Types.Position) {
    const cell = this.props.puzzle.squares[row][column];
    if (!cell || cell.black) {
      return;
    }
    if (row === this.state.row && column === this.state.column) {
      this.setState({
        direction:
          this.state.direction === Types.Direction.DOWN
            ? Types.Direction.ACROSS
            : Types.Direction.DOWN
      });
    } else {
      this.setState({ row: row, column: column });
    }
  }

  onSelectClue({ number, direction }: Types.SelectClueEvent) {
    this.props.puzzle.squares.find((row, r) => {
      const cell = row.find((cell, c) => {
        if (cell.black) {
          return null;
        }
        if (cell.number === number) {
          this.setState({
            row: r,
            column: c,
            direction: direction
          });
          return cell;
        }
        return false;
      });
      return cell;
    });
  }

  row(): number {
    return this.state.row;
  }

  column(): number {
    return this.state.column;
  }

  direction(): Types.Direction {
    return this.state.direction;
  }

  selectedSquare(): Types.LetterCell {
    const cell = this.props.puzzle.squares[this.row()][this.column()];
    if (cell.black) {
      throw new Error("selected black cell");
    }
    return cell;
  }

  acrossClue(): number {
    return this.selectedSquare().clue_across;
  }

  downClue(): number {
    return this.selectedSquare().clue_down;
  }

  selectedClueNumber(): number {
    return this.direction() === Types.Direction.DOWN
      ? this.downClue()
      : this.acrossClue();
  }

  selectedClue(): Types.Clue {
    const clues =
      this.direction() === Types.Direction.DOWN
        ? this.props.puzzle.down_clues
        : this.props.puzzle.across_clues;
    const num = this.selectedClueNumber();
    const clue = clues.find(c => c.number === num);
    if (clue) {
      return clue;
    }
    throw new Error("illegal clue");
  }

  componentDidMount() {
    window.addEventListener("keydown", this.keyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.keyDown);
  }

  render() {
    return (
      <div id="puzzle">
        <Metadata puzzle={this.props.puzzle} solved={false} />
        <CurrentClue clue={this.selectedClue()} direction={this.direction()} />
        <PuzzleGrid
          puzzle={this.props.puzzle}
          row={this.row()}
          column={this.column()}
          direction={this.direction()}
          onClickCell={this.onClickCell}
          /*
            gameId={this.props.gameId}
          onInput={this.onInput}
          squares={this.props.squares}
          puzzle={this.props.puzzle}
          fills={this.game.state.fills}
          delegate={this.delegate} */
        />
        <ClueBox
          // onSelect={this.selectClue}
          puzzle={this.props.puzzle}
          down_clue={this.downClue()}
          across_clue={this.acrossClue()}
          direction={this.direction()}
          onSelect={this.onSelectClue}
        />
      </div>
      /*
       */
      /*
        {this.props.gameId && (
          <Sidebar
            doReveal={this.reveal}
            doCheck={this.check}
            gameId={this.props.gameId}
            currentUser={this.props.currentUser}
          />
        )}
*/
    );
  }
}
