import React from 'react';
import classNames from 'classnames';
import { withTracker } from 'meteor/react-meteor-data';
import { cursorState } from '../ui/cursor.jsx';

/* global FillsBySquare */

class PuzzleCell extends React.PureComponent {
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

const withFill = withTracker(
  ({ square, gameId }) => {
    if (!square) {
      return { fill: {} };
    }
    return {
      fill: FillsBySquare.find({ square: square._id, game: gameId }) || {},
    };
  });

const wrapCell = withTracker(
  ({ square, gameId, onClick }) => {
    const cursor = cursorState();
    if (!square) {
      return { };
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
    };

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
  });

export default withFill(wrapCell(PuzzleCell));