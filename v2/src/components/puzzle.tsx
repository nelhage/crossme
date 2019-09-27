import React from "react";

import "./style/puzzle.css";

import { Clue, Puzzle, Direction, LetterCell } from "../types";

import { Metadata } from "./metadata";
import { PuzzleGrid } from "./puzzle_grid";
import { CurrentClue } from "./current_clue";
import { ClueBox } from "./clue_box";

export interface PuzzleProps {
  puzzle: Puzzle;
}

export interface PuzzleState {
  row: number;
  column: number;
  direction: Direction;
}

interface Position {
  row: number;
  column: number;
}

export class PuzzleComponent extends React.Component<PuzzleProps, PuzzleState> {
  constructor(props: PuzzleProps) {
    super(props);
    this.state = {
      row: 1,
      column: 2,
      direction: Direction.DOWN
    };

    this.onClick = this.onClick.bind(this);
  }

  onClick({ row, column }: Position) {
    const cell = this.props.puzzle.squares[row][column];
    if (!cell || cell.black) {
      return;
    }
    if (row === this.state.row && column === this.state.column) {
      this.setState({
        direction:
          this.state.direction === Direction.DOWN
            ? Direction.ACROSS
            : Direction.DOWN
      });
    } else {
      this.setState({ row: row, column: column });
    }
  }

  row(): number {
    return this.state.row;
  }

  column(): number {
    return this.state.column;
  }

  direction(): Direction {
    return this.state.direction;
  }

  selectedSquare(): LetterCell {
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
    return this.direction() === Direction.DOWN
      ? this.downClue()
      : this.acrossClue();
  }

  selectedClue(): Clue {
    const clues =
      this.direction() === Direction.DOWN
        ? this.props.puzzle.down_clues
        : this.props.puzzle.across_clues;
    const num = this.selectedClueNumber();
    const clue = clues.find(c => c.number === num);
    if (clue) {
      return clue;
    }
    throw new Error("illegal clue");
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
          onClickCell={this.onClick}
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
