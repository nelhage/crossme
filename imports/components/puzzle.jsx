import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Tracker } from 'meteor/tracker';
import { ReactiveDict } from 'meteor/reactive-dict';

import Sidebar from './controls.jsx';
import PuzzleCellContainer from './puzzle_cell.jsx';
import ClueBoxContainer from './clue_box.jsx';
import CurrentClueContainer from './current_clue.jsx';
import Metadata from './metadata.jsx';
import GameDelegate from '../ui/game_delegate.jsx';

import Game from '../ui/game.jsx';
import { cursorState } from '../ui/cursor.jsx';

/* global Puzzles, Clues, Fills, Squares */

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
  computeWidth() {
    return (this.props.puzzle.width * 31) + 10;
  }

  render() {
    const rows = this.props.squares.map((row, i) => {
      const cells = row.map((cell, c) => (
        <PuzzleCellContainer
          key={cell._id}
          square={cell}
          gameId={this.props.gameId}
          fills={this.props.fills}
          onClick={() => this.props.onClickCell({ row: i, column: c })}
          delegate={this.props.delegate}
        />
      ));
      return (
        <div className="row" key={row[0]._id}>
          {cells}
        </div>
      );
    });

    // In order to support mobile devices, we create an
    // off-screen <input> field, which we ensure is always focused
    // as long as the cursor is on a crossword cell. This forces
    // mobile devices to pop up a keyboard, and we then listen for
    // onInput events to catch keystrokes. We use a password field
    // because that forces a letter-by-letter keyboard and input mode,
    // avoiding potentially buffering input in the keyboard itself
    // before it hits the DOM.
    return (
      <div id="puzzlegrid">
        <meta name="viewport" content={`width=${this.computeWidth()}, user-scalable=no`} id="viewport-meta" />
        <input
          id="puzzleinput"
          defaultValue=""
          type="password"
          onInput={this.props.onInput}
        />
        {rows}
      </div>
    );
  }
}

class Puzzle extends React.Component {
  constructor(props) {
    super(props);

    this.delegate = new GameDelegate(this);
    this.game = new Game(this.delegate, {
      squares: this.props.squares,
      clues: this.props.clues,
    });
    this.startSync(props.gameId);

    this.selectClue = this.selectClue.bind(this);
    this.clickCell = this.clickCell.bind(this);
    this.keyDown = this.keyDown.bind(this);
    this.onInput = this.onInput.bind(this);
    this.reveal = this.reveal.bind(this);
    this.check = this.check.bind(this);
  }

  componentDidMount() {
    window.addEventListener('keydown', this.keyDown);
  }

  componentWillReceiveProps(newProps) {
    this.game.state.squares = newProps.squares;
    this.game.state.clues = newProps.clues;
    if (newProps.gameId !== this.props.gameId) {
      this.startSync(newProps.gameId);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.keyDown);
    this.stopSync();
  }

  onInput(e) {
    this.game.letter(e.target.value);
    e.target.value = '';
    e.preventDefault();
  }

  stopSync() {
    if (this.handles) {
      this.handles.forEach(h => h.stop());
    }
  }

  startSync(gameId) {
    this.stopSync();
    Tracker.nonreactive(() => {
      this.handles = [];
      this.handles.push(
        Tracker.autorun(() => {
          const user = Meteor.user();
          if (user) {
            this.game.state.profile = user.profile;
          } else {
            this.game.state.profile = {};
          }
          this.game.state.cursor = cursorState();
        }));
      this.game.state.fills = new ReactiveDict();
      this.handles.push(
        Fills.find({ game: gameId }).observe({
          added: (e) => {
            this.game.state.fills.set(e.square, e);
          },
          changed: (e) => {
            this.game.state.fills.set(e.square, e);
          },
          removed: (e) => {
            this.game.state.fills.set(e.square, undefined);
          },
        }));
    });
  }

  selectClue(number, direction) {
    const s = Squares.findOne({ puzzle: this.props.puzzle._id, number });
    this.delegate.select(s, direction);
  }

  clickCell({ row, column }) {
    const sq = this.props.squares[row][column];
    if (!sq || sq.black) {
      return;
    }
    const selected = this.game.selectedSquare();
    if (selected && sq._id === selected._id) {
      this.game.switchDirection();
    } else {
      this.delegate.select(sq);
    }
  }

  keyDown(e) {
    if (e.target.nodeName === 'INPUT' && e.target.classList.contains('fill')) {
      if (e.key === 'Tab') {
        this.game.nextClue(e.shiftKey);
        e.target.blur();
        e.preventDefault();
      } else if (e.key === 'Enter') {
        e.target.blur();
        e.preventDefault();
        Session.set('rebus', false);
      }

      return;
    }

    if (e.altKey && e.key === 'p') {
      this.delegate.togglePencil();
    }

    if (e.altKey || e.ctrlKey || e.metaKey) {
      return;
    }

    const arrows = {
      ArrowRight: [0, 1],
      ArrowLeft: [0, -1],
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
    };

    if (e.key in arrows) {
      const [dr, dc] = arrows[e.key];
      this.game.arrow(dr, dc);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      this.game.switchDirection();
      e.preventDefault();
    } else if (e.key === 'Tab') {
      this.game.nextClue(e.shiftKey);
      e.preventDefault();
    } else if (!this.props.gameId) {
      /* skip other keys if we're in preview mode */
    } else if (e.key === ' ') {
      this.game.clear();
      e.preventDefault();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      this.game.delete();
      e.preventDefault();
    }
  }

  reveal(what) {
    this.delegate.reveal(
      this.game.selectedSquare(),
      this.game.state.cursor.selected_direction,
      what);
  }

  check(what) {
    this.delegate.check(
      this.game.selectedSquare(),
      this.game.state.cursor.selected_direction,
      what);
  }

  render() {
    return (
      <div
        id="puzzle"
      >
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
          onInput={this.onInput}
          squares={this.props.squares}
          puzzle={this.props.puzzle}
          fills={this.game.state.fills}
          delegate={this.delegate}
        />
        <ClueBoxContainer
          onSelect={this.selectClue}
          clues={this.props.clues}
        />
        {this.props.gameId &&
        <Sidebar
          doReveal={this.reveal}
          doCheck={this.check}
          gameId={this.props.gameId}
          currentUser={this.props.currentUser}
        />}
      </div>
    );
  }
}

export default withPuzzle(Puzzle);
