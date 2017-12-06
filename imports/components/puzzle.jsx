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
    const clues = { across: [], down: [] };
    Clues.find({ puzzle: puzzleId }).forEach((clue) => {
      clues[clue.direction][clue.number] = clue;
    });

    return {
      puzzle,
      squares: grid,
      clues,
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
  constructor(props) {
    super(props);

    this.selectClue = this.selectClue.bind(this);
    this.select = this.select.bind(this);
    this.clickCell = this.clickCell.bind(this);
  }

  selectClue(number, direction) {
    const s = Squares.findOne({ puzzle: this.props.puzzle.id, number });
    Session.set('selected-direction', direction);
    this.select(s);
  }

  clickCell({ row, column }) {
    const sq = this.props.squares[row][column];
    if (sq && !sq.black) {
      this.select(sq);
    }
  }

  scrollIntoView(e) {
    if (e.length) {
      const r = e[0].getClientRects()[0];
      if (document.elementFromPoint(r.left, r.top) !== e[0] ||
          document.elementFromPoint(r.right, r.bottom) !== e[0]) {
        e[0].scrollIntoView();
      }
    }
  }

  selectedSquare() {
    return this.props.squares[Session.get('selected-row')][Session.get('selected-column')];
  }

  select(square) {
    Session.set('selected-row', square.row);
    Session.set('selected-column', square.column);
    Session.set('word-across', square.word_across);
    Session.set('word-down', square.word_down);
    Session.set('check-ok', null);
    if (!Session.get('selected-direction')) {
      Session.set('selected-direction', 'across');
    }
    this.scrollIntoView($(`#clues .across .clue.clue-${square.word_across}`));
    this.scrollIntoView($(`#clues .down .clue.clue-${square.word_down}`));
  }

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
          onClickCell={this.clickCell}
          squares={this.props.squares}
          puzzle={this.props.puzzle}
        />
        <ClueBoxContainer
          onSelect={this.selectClue}
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
