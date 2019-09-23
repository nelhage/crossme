import React from "react";

import { Puzzle } from "../types";

import { Metadata } from "./metadata";

export interface PuzzleProps {
  puzzle: Puzzle;
}

export class PuzzleComponent extends React.Component<PuzzleProps> {
  render() {
    return (
      <div id="puzzle">
        <Metadata puzzle={this.props.puzzle} solved={false} />
      </div>
      /*
        <CurrentClueContainer
          puzzleId={this.props.puzzleId}
          clues={this.props.clues}
          squares={this.props.squares}
        />
        <PuzzleGrid
          gameId={this.props.gameId}
          onClickCell={this.clickCell}
          onInput={this.onInput}
          squares={this.props.squares}
          puzzle={this.props.puzzle}
          fills={this.game.state.fills}
          delegate={this.delegate}
        />
        <ClueBoxContainer onSelect={this.selectClue} clues={this.props.clues} />
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
