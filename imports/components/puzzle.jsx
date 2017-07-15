import React from 'react';
import classNames from 'classnames';
import { createContainer } from 'meteor/react-meteor-data';

import Sidebar from './controls.jsx';

/* global Router */
/* global Puzzles, Squares, FillsBySquare, Clues */

class PuzzleGrid extends React.Component {
  cellProps(cell) {
    const cursor = this.props.cursor;
    const props = {
      key: cell._id,
      number: cell.number,
      black: cell.black,
      circled: cell.circled,
      fill: cell.fill,
      letter: cell.letter,
      selected: (cursor.selected_row === cell.row &&
                 cursor.selected_column === cell.column),
      onClick: () => { this.props.onClickCell(cell); },
    };
    if (props.selected) {
      return props;
    }

    if (cursor.word_across === cell.word_across) {
      if (cursor.selected_direction === 'across') {
        props.inWord = true;
      } else {
        props.otherWord = true;
      }
    }
    if (cursor.word_down === cell.word_down) {
      if (cursor.selected_direction === 'down') {
        props.inWord = true;
      } else {
        props.otherWord = true;
      }
    }

    return props;
  }

  render() {
    /* eslint-disable react/no-array-index-key */
    /*
     * This is a grid indexed by (y,x), so the index here is actually
     * a fine key.
     */
    const rows = this.props.grid.map((row, i) => {
      const cells = row.map(cell => <PuzzleCell {...this.cellProps(cell)} />);
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

function gridState(puzzleId, gameId) {
  const rows = [];
  const puz = Puzzles.findOne({ _id: puzzleId });
  if (!puz) {
    return null;
  }

  for (let r = 0; r < puz.height; r += 1) {
    const cells = Squares.find({ puzzle: puz._id, row: r }, { sort: { column: 1 } });
    rows.push(cells.map((cell) => {
      const fill = FillsBySquare.find({ square: cell._id, game: gameId });
      return { fill: fill || {}, ...cell };
    }));
  }
  return rows;
}

function cursor() {
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
   }) => ({
     puzzleId,
     gameId,
     onClickCell,
     grid: gridState(puzzleId, gameId),
     cursor: cursor(),
   }), PuzzleGrid);

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
          {this.props.preview && (
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

const MetadataContainer = createContainer(({ puzzleId, preview }) => {
  const puzzle = Puzzles.findOne({ _id: puzzleId });
  return {
    preview,
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
  ({ onSelect, puzzleId }) =>
    ({
      cursor: cursor(),
      clues: {
        across: Clues.find({ puzzle: puzzleId, direction: 'across' },
                           { sort: { number: 1 } }).fetch(),
        down: Clues.find({ puzzle: puzzleId, direction: 'down' },
                         { sort: { number: 1 } }).fetch(),
      },
      onSelect,
    }), ClueBox);

export default class Puzzle extends React.Component {
  render() {
    return (
      <div id="puzzle">
        <MetadataContainer puzzleId={this.props.puzzleId} preview={this.props.preview} />
        <CurrentClue clue={this.props.currentClue} />
        <PuzzleGridContainer
          puzzleId={this.props.puzzleId}
          gameId={this.props.gameId}
          onClickCell={this.props.onClickCell}
        />
        <ClueBoxContainer
          puzzleId={this.props.puzzleId}
          onSelect={this.props.onSelect}
        />
        {!this.props.preview &&
          <Sidebar
            doReveal={this.props.doReveal}
            doCheck={this.props.doCheck}
            checkOk={this.props.checkOk}
            isPencil={this.props.isPencil}
            currentUser={this.props.currentUser}
            players={this.props.players}
          />}
      </div>
    );
  }
}
