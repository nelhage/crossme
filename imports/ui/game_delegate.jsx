/* global Squares */

export default class GameDelegate {
  constructor(component) {
    this.component = component;
  }

  select(square, direction) {
    Session.set('selected-row', square.row);
    Session.set('selected-column', square.column);
    Session.set('word-across', square.word_across);
    Session.set('word-down', square.word_down);
    Session.set('rebus', false);
    if (direction) {
      Session.set('selected-direction', direction);
    } else if (!Session.get('selected-direction')) {
      Session.set('selected-direction', 'across');
    }
    this.scrollIntoView($(`#clues .across .clue.clue-${square.word_across}`));
    this.scrollIntoView($(`#clues .down .clue.clue-${square.word_down}`));
    document.getElementById('puzzleinput').focus();
  }

  setDirection(direction) {
    Session.set('selected-direction', direction);
    document.getElementById('puzzleinput').focus();
  }

  scrollIntoView(e) {
    if (e.length) {
      const node = e[0];
      node.parentNode.scrollTop = node.offsetTop - node.parentNode.offsetTop;
    }
  }

  isPencil() {
    return Session.equals('pencil', true);
  }

  setFill(square, fill) {
    Meteor.call('setLetter',
                this.component.props.gameId,
                square._id,
                fill.toUpperCase(),
                this.isPencil());
  }

  reveal(square, direction, target) {
    Meteor.call('reveal', {
      game: this.component.props.gameId,
      square: square._id,
      direction,
    }, target);
  }

  check(square, direction, target) {
    const self = this;
    Meteor.call('check', {
      game: this.component.props.gameId,
      square: square._id,
      direction,
    }, target, function (error, dst) {
      if (error !== undefined) {
        return;
      }
      self.select(Squares.findOne({ _id: dst }));
    });
  }

  clearFill(square) {
    Meteor.call('clearLetter', this.component.props.gameId, square._id);
  }

  togglePencil() {
    Session.set('pencil', !Session.get('pencil'));
  }
}
