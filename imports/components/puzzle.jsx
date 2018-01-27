import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';

import Sidebar from './controls.jsx';
import PuzzleCellContainer from './puzzle_cell.jsx';
import ClueBoxContainer from './clue_box.jsx';
import CurrentClueContainer from './current_clue.jsx';
import Metadata from './metadata.jsx';
import GameDelegate from '../ui/game_delegate.jsx';

import Game from '../ui/game.jsx';
import { cursorState } from '../ui/cursor.jsx';

/* global Puzzles, Clues, Fills, Squares, Tracker */

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
          delegate={this.props.delegate}
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

    this.delegate = new GameDelegate(this);
    this.game = new Game(this.delegate, {
      squares: this.props.squares,
      clues: this.props.clues,
    });
    this.startSync(props.gameId);

    this.selectClue = this.selectClue.bind(this);
    this.clickCell = this.clickCell.bind(this);
    this.keyDown = this.keyDown.bind(this);
  }

  componentDidMount() {
    this.div.focus();
  }

  componentWillReceiveProps(newProps) {
    this.game.state.squares = newProps.squares;
    this.game.state.clues = newProps.clues;
    if (newProps.gameId !== this.props.gameId) {
      this.startSync(newProps.gameId);
    }
  }

  componentWillUnmount() {
    this.stopSync();
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
      this.game.state.fills = {};
      this.handles.push(
        Fills.find({ game: gameId }).observe({
          added: (e) => {
            this.game.state.fills[e.square] = e;
          },
          changed: (e) => {
            this.game.state.fills[e.square] = e;
          },
          removed: (e) => {
            delete this.game.state.fills[e.square];
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
    if (sq && !sq.black) {
      this.delegate.select(sq);
    }
  }

  keyDown(e) {
    if (e.target.nodeName === 'INPUT') {
      if (e.key === 'Tab') {
        this.game.nextClue(e.shiftKey);
        e.target.blur();
        e.preventDefault();
      } else if (e.key === 'Enter') {
        e.target.blur();
        e.preventDefault();
        Session.set('rebus', false);
        this.div.focus();
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
    } else if (e.key.length === 1 &&
               e.key.toLowerCase() >= 'a' &&
               e.key.toLowerCase() <= 'z') {
      this.game.letter(e.key);
      e.preventDefault();
    }
  }

  selectedSquare() {
    return this.props.squares[Session.get('selected-row')][Session.get('selected-column')];
  }

  render() {
    return (
      /* eslint-disable jsx-a11y/no-static-element-interactions,
                        jsx-a11y/no-noninteractive-tabindex
      */
      <div
        id="puzzle"
        onKeyDown={this.keyDown}
        tabIndex="0"
        ref={(div) => { this.div = div; }}
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
          squares={this.props.squares}
          puzzle={this.props.puzzle}
          delegate={this.delegate}
        />
        <ClueBoxContainer
          onSelect={this.selectClue}
          clues={this.props.clues}
        />
        {this.props.gameId &&
          <Sidebar
            doReveal={this.props.doReveal}
            doCheck={this.props.doCheck}
            gameId={this.props.gameId}
            currentUser={this.props.currentUser}
          />}
      </div>
    );
  }
}

export default withPuzzle(Puzzle);
