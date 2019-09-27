import React from "react";

import "./style/puzzle.css";

import { Clue, Puzzle, Direction } from "../types";

import { Metadata } from "./metadata";
import { PuzzleGrid } from "./puzzle_grid";
import { CurrentClue } from "./current_clue";
import { ClueBox } from "./clue_box";

export interface PuzzleProps {
  puzzle: Puzzle;
}

export class PuzzleComponent extends React.Component<PuzzleProps> {
  row(): number {
    return 1;
  }

  column(): number {
    return 1;
  }

  acrossClue(): number {
    return 14;
  }

  downClue(): number {
    return 2;
  }

  direction(): Direction {
    return Direction.DOWN;
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
          /*
            gameId={this.props.gameId}
          onClickCell={this.clickCell}
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
