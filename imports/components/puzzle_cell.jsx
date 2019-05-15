import React from 'react';
import classNames from 'classnames';
import { withTracker } from 'meteor/react-meteor-data';
import { cursorState } from '../ui/cursor.jsx';

class PuzzleCell extends React.PureComponent {
  constructor(props) {
    super(props);
    this.setSquare = (e) => {
      this.props.delegate.setFill(this.props.square, e.target.value.trim());
    };
  }

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
      rebus: this.props.fill.letter && this.props.fill.letter.length > 1,
    };

    return classes;
  }

  render() {
    const classes = this.computeClasses();

    /* eslint-disable jsx-a11y/no-autofocus */
    return (
      <div role="button" className={classNames('cell', classes)} onClick={!this.props.rebus && this.props.onClick} >
        <div className="circle">
          {this.props.number && (
            <div className="numberlabel">
              {this.props.number}
            </div>
          )}
          <div className="cellbody">
            {this.props.rebus ? (
              <input
                className="fill"
                defaultValue={this.props.fill.letter}
                onBlur={this.setSquare}
                autoFocus="true"
              />
            ) : (
              <div className="fill">
                {this.props.fill.letter}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

const withFill = withTracker(
  ({ fills, square }) => {
    if (!square) {
      return { fill: {} };
    }
    return {
      fill: fills.get(square._id) || {},
    };
  });

const wrapCell = withTracker(
  ({ square, gameId, onClick }) => {
    if (!square) {
      return { };
    }
    const cursor = cursorState();
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
      props.rebus = Session.get('rebus');
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
