import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';

import Sidebar from './controls.jsx';
import PuzzleCellContainer from './puzzle_cell.jsx';
import ClueBoxContainer from './clue_box.jsx';
import CurrentClueContainer from './current_clue.jsx';
import Metadata from './metadata.jsx';

/* global Puzzles, Clues, Squares */

const withPuzzle = withTracker(
  ({ puzzleId }) => {
    const puzzle = Puzzles.findOne({ _id: puzzleId }) || { _id: puzzleId, width: 1, height: 1 };
    const squares = Squares.find({ puzzle: puzzleId }, { sort: { row: 1, column: 1 } }).fetch();
    const grid = [];
    let row = [];
    squares.forEach((sq) => {
      if (row.length === 0 || sq.row === row[0].row) {
        row.push(sq);
      } else {
        grid.push(row);
        row = [sq];
      }
    });
    if (row.length > 0) {
      grid.push(row);
    }

    return {
      puzzle,
      squares: grid,
      clues: {
        across: Clues.find({ puzzle: puzzleId, direction: 'across' },
                           { sort: { number: 1 } }).fetch(),
        down: Clues.find({ puzzle: puzzleId, direction: 'down' },
                         { sort: { number: 1 } }).fetch(),
      },
    };
  });

class PuzzleGrid extends React.Component {
  render() {
    const rows = this.props.squares.map((row, i) => {
      const cells = row.map((cell, c) => (
        <PuzzleCellContainer
          key={cell._id}
          square={cell}
          gameId={this.props.gameId}
          onClick={() => this.props.onClickCell({ row: i, column: c })}
        />
      ));
      return (
        <div className="row" key={row[0]._id}>
          {cells}
        </div>
      );
    });

    return (
      <div id="puzzlegrid">
        {rows}
      </div>
    );
  }
}

class Puzzle extends React.Component {
  render() {
    return (
      <div id="puzzle">
        <Metadata
          puzzle={this.props.puzzle}
          gameId={this.props.gameId}
        />
        <CurrentClueContainer
          puzzleId={this.props.puzzleId}
          clues={this.props.clues}
          squares={this.props.squares}
        />
        <PuzzleGrid
          gameId={this.props.gameId}
          onClickCell={this.props.onClickCell}
          squares={this.props.squares}
          puzzle={this.props.puzzle}
        />
        <ClueBoxContainer
          onSelect={this.props.onSelect}
          clues={this.props.clues}
        />
        {this.props.gameId &&
          <Sidebar
            doReveal={this.props.doReveal}
            doCheck={this.props.doCheck}
            checkOk={this.props.checkOk}
            gameId={this.props.gameId}
            currentUser={this.props.currentUser}
          />}
      </div>
    );
  }
}

export default withPuzzle(Puzzle);
