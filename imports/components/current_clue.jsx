import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';

import { cursorState } from '../ui/cursor.jsx';

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

export default withTracker(({ squares, clues }) => {
  const cursor = cursorState();
  const row = squares && squares[cursor.selected_row];
  const square = row && row[cursor.selected_column];
  if (!square) {
    return {};
  }
  return {
    clue: clues[cursor.selected_direction][square[`word_${cursor.selected_direction}`]],
  };
})(CurrentClue);
