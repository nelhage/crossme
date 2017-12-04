import { withTracker } from 'meteor/react-meteor-data';

export function cursorState() {
  return {
    selected_row: Session.get('selected-row'),
    selected_column: Session.get('selected-column'),
    selected_direction: Session.get('selected-direction'),
    word_across: Session.get('word-across'),
    word_down: Session.get('word-down'),
  };
}

export const withCursor = withTracker(() => { return { cursor: cursorState() }; });
