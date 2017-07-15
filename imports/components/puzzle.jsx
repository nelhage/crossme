import React from 'react';
import classNames from 'classnames';
import { createContainer } from 'meteor/react-meteor-data';
import { _ } from 'meteor/underscore';

import Sidebar from './controls.jsx';

/* global Router */
/* global Puzzles, FillsBySquare, Clues, SquaresByPosition */

class PuzzleGrid extends React.Component {
  render() {
    /* eslint-disable react/no-array-index-key */
    /*
     * This is a grid indexed by (y,x), so the index here is actually
     * a fine key.
     */
    const rows = _.range(this.props.height).map((i) => {
      const cells = _.range(this.props.width).map(c => (
        <PuzzleCellContainer
          key={c}
          puzzleId={this.props.puzzleId}
          gameId={this.props.gameId}
          pos={{ row: i, column: c }}
          onClick={() => this.props.onClickCell({ row: i, column: c })}
        />
      ));
      return (
        <div className="row" key={i}>
          {cells}
        </div>
      );
    });
    /* eslint-enable react/no-array-index-key */
    return (
      <div id="puzzlegrid">
        {rows}
      </div>
    );
  }
}

function cursorState() {
  return {
    selected_row: Session.get('selected-row'),
    selected_column: Session.get('selected-column'),
    selected_direction: Session.get('selected-direction'),
    word_across: Session.get('word-across'),
    word_down: Session.get('word-down'),
  };
}

const PuzzleGridContainer = createContainer(
  ({ puzzleId,
     gameId,
     onClickCell,
   }) => {
    const puzzle = Puzzles.findOne({ _id: puzzleId });
    return {
      puzzleId,
      gameId,
      onClickCell,
      height: puzzle ? puzzle.height : 0,
      width: puzzle ? puzzle.width : 0,
      cursor: cursorState(),
    };
  }, PuzzleGrid);

class PuzzleCell extends React.Component {
  computeClasses() {
    if (this.props.black) {
      return 'filled';
    }
    const classes = {
      circled: this.props.circled,
      selected: this.props.selected,
      inword: this.props.inWord,
      otherword: this.props.otherWord,
      reveal: this.props.fill.reveal,
      wrong: (this.props.fill.checked === 'checking'),
      checked: (this.props.fill.checked === 'checked'),
      correct: (this.props.fill.correct && this.props.letter === this.props.fill.letter),
      pencil: this.props.fill.pencil,
    };

    return classes;
  }

  render() {
    const classes = this.computeClasses();

    return (
      <div role="button" className={classNames('cell', classes)} onClick={this.props.onClick} >
        <div className="circle">
          {this.props.number && (
            <div className="numberlabel">
              {this.props.number}
            </div>
          )}
          <div className="cellbody">
            <div className="fill">
              {this.props.fill.letter}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const PuzzleCellContainer = createContainer(
  ({ puzzleId, gameId, pos, onClick }) => {
    const cursor = cursorState();
    const square = SquaresByPosition.find(
      { puzzle: puzzleId, row: pos.row, column: pos.column },
    );
    if (!square) {
      return { fill: {} };
    }
    const props = {
      gameId,
      number: square.number,
      black: square.black,
      circled: square.circled,
      letter: square.letter,
      selected: (
        cursor.selected_row === square.row &&
          cursor.selected_column === square.column
      ),
      onClick,
      fill: {},
    };
    const fill = FillsBySquare.find({ square: square._id, game: gameId });
    if (fill) {
      props.fill = fill;
    }

    if (props.selected) {
      return props;
    }

    if (cursor.word_across === square.word_across) {
      if (cursor.selected_direction === 'across') {
        props.inWord = true;
      } else {
        props.otherWord = true;
      }
    }

    if (cursor.word_down === square.word_down) {
      if (cursor.selected_direction === 'down') {
        props.inWord = true;
      } else {
        props.otherWord = true;
      }
    }

    return props;
  }, PuzzleCell);

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
  const puzzle = Puzzles.findOne({ _id: puzzleId });
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

const ClueBoxContainer = createContainer(
  ({ onSelect, puzzleId }) => {
    return {
      cursor: cursorState(),
      clues: {
        across: Clues.find({ puzzle: puzzleId, direction: 'across' },
                           { sort: { number: 1 } }).fetch(),
        down: Clues.find({ puzzle: puzzleId, direction: 'down' },
                         { sort: { number: 1 } }).fetch(),
      },
      onSelect,
    };
  }, ClueBox);

export default class Puzzle extends React.Component {
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
        <PuzzleGridContainer
          puzzleId={this.props.puzzleId}
          gameId={this.props.gameId}
          onClickCell={this.props.onClickCell}
        />
        <ClueBoxContainer
          puzzleId={this.props.puzzleId}
          onSelect={this.props.onSelect}
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
