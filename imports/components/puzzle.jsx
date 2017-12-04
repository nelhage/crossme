import React from 'react';
import classNames from 'classnames';
import { createContainer, withTracker } from 'meteor/react-meteor-data';

import Sidebar from './controls.jsx';
import PuzzleCellContainer from './puzzle_cell.jsx';

import { withCursor, cursorState } from '../ui/cursor.jsx';

/* global Router */
/* global Puzzles, Clues, Squares, SquaresByPosition */

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

class Metadata extends React.Component {
  startGame() {
    const id = this.props.puzzle._id;
    Meteor.call('newGame', id, function (error, gotId) {
      if (!error) {
        Router.go('game', { id: gotId });
      }
    });
  }

  render() {
    return (
      <div id="details">
        <div className="title">
          <span className="label label-default">Title</span>
          <span className="value"> {this.props.puzzle.title}</span>
          {(!this.props.gameId) && (
            <span>
              <span className="preview label">Preview</span>
              <button className="btn" onClick={this.startGame.bind(this)}>Start Game</button>
            </span>
          )}
        </div>
        <div className="author">
          <span className="label label-default">By</span>
          <span className="value">{this.props.puzzle.author}</span>
        </div>
      </div>
    );
  }
}

const MetadataContainer = createContainer(({ puzzleId, gameId }) => {
  const puzzle = Puzzles.findOne({ _id: puzzleId }) || { _id: puzzleId };
  return {
    gameId,
    puzzle,
  };
}, Metadata);

class CurrentClue extends React.Component {
  render() {
    const clue = this.props.clue;
    if (!clue) {
      return null;
    }
    return (
      <div id="theclue">
        <span className="label">
          <span className="number">{clue.number}</span>
          <span className="direction"> {clue.direction}</span>
        </span>
        <span className="text">{clue.text}</span>
        <div className="clear" />
      </div>
    );
  }
}

const CurrentClueContainer = createContainer(({ puzzleId }) => {
  const cursor = cursorState();
  const square = SquaresByPosition.find({
    puzzle: puzzleId,
    row: cursor.selected_row,
    column: cursor.selected_column,
  });
  if (!square) {
    return {};
  }
  return {
    clue: Clues.findOne({
      puzzle: puzzleId,
      direction: cursor.selected_direction,
      number: square[`word_${cursor.selected_direction}`],
    }),
  };
}, CurrentClue);

class ClueBox extends React.Component {
  constructor(props) {
    super(props);
    this.onSelect = this.onSelect.bind(this);
  }

  onSelect(e) {
    const target = e.target;
    this.props.onSelect(parseInt(target.dataset.number, 10),
                        target.dataset.direction);
  }

  isSelected(clue, direction) {
    if (this.props.cursor[`word_${direction}`] !== clue.number) {
      return false;
    }
    if (this.props.cursor.selected_direction === direction) {
      return 'selected';
    }
    return 'otherword';
  }

  clueGroup(clues) {
    return (
      clues.map(c => (
        <Clue
          key={c._id}
          number={c.number}
          text={c.text}
          direction={c.direction}
          selected={this.isSelected(c, c.direction)}
          onClick={this.onSelect}
        />
        ))
    );
  }

  render() {
    const acrossClues = this.clueGroup(this.props.clues.across, 'across');
    const downClues = this.clueGroup(this.props.clues.down, 'down');
    return (
      <div id="clues">
        <div className="section across">
          <div className="title"> Across </div>
          <div className="cluelist">
            {acrossClues}
          </div>
        </div>
        <div className="section down">
          <div className="title"> Down </div>
          <div className="cluelist">
            {downClues}
          </div>
        </div>
      </div>
    );
  }
}

const ClueBoxContainer = withCursor(ClueBox);

class Clue extends React.Component {
  render() {
    const classes = classNames('clue', `clue-${this.props.number}`, this.props.selected);
    return (
      <div
        role="button"
        className={classes}
        onClick={this.props.onClick}
        data-number={this.props.number}
        data-direction={this.props.direction}
      >
        {this.props.number}. {this.props.text}
      </div>
    );
  }
}

class Puzzle extends React.Component {
  render() {
    return (
      <div id="puzzle">
        <MetadataContainer
          puzzleId={this.props.puzzleId}
          gameId={this.props.gameId}
        />
        <CurrentClueContainer
          puzzleId={this.props.puzzleId}
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
