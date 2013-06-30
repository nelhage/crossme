function active_puzzle() {
  var id = Session.get('puzzleid');
  if (!id) return null;
  return Puzzles.findOne({_id: id});
}

Template.puzzle.show = function() {
  return !!active_puzzle();
}

Template.puzzle.rows = function() {
  var rows = [];
  var puz = active_puzzle();
  for (var r = 0; r < puz.height; r++) {
    rows.push({puzzle: puz, row: r});
  }
  return rows;
}

function move(dr, dc) {
  var row = Session.get('selected-row') || 0,
      col = Session.get('selected-column') || 0;
  var puz = active_puzzle();
  while (true) {
    row += dr;
    col += dc;
    if (row < 0 || row >= puz.height ||
        col < 0 || col >= puz.width)
      return true;
    if (!Squares.findOne({row: row, column: col, puzzle: puz._id}).black)
      break;
  }
  var s = Squares.findOne({row: row, column: col, puzzle: puz._id});
  Session.set('selected-row', row);
  Session.set('selected-column', col);
  Session.set('word-across', s.word_across);
  Session.set('word-down', s.word_down);
  return false;
}

function handle_key(k) {
  if (k.keyCode === 39)
    return move(0, 1);
  else if (k.keyCode === 37)
    return move(0, -1);
  else if (k.keyCode === 38)
    return move(-1, 0);
  else if(k.keyCode === 40)
    return move(1, 0);
}

Template.row.cells = function() {
  return Squares.find({puzzle: this.puzzle._id, row: this.row},{sort: {column: 1}}).fetch();
}

Template.cell.number = function() {
  return this.number;
}

Template.cell.css_class = function() {
  var classes = []
  if (this.black)
    classes.push("filled");
  var sel;
  if (Session.equals('selected-row', this.row) &&
      Session.equals('selected-column', this.column))
    classes.push('selected');
  else if (Session.equals('word-across', this.word_across) ||
      Session.equals('word-down', this.word_down))
    classes.push('inword');
  return classes.join(' ');
}

Template.clues.across_clues = function() {
  return Clues.find({puzzle: Session.get('puzzleid'), direction: 'across'}, {sort: {number: 1}});
}

Template.clues.down_clues = function() {
  return Clues.find({puzzle: Session.get('puzzleid'), direction: 'down'}, {sort: {number: 1}});
}

Template.clue.number = function() {
  return this.number;
}

Template.clue.text = function() {
  return this.text;
}

Template.clue.css_class = function() {
  if (Session.equals('word-' + this.direction, this.number))
    return 'selected';
  return '';
}

window.new_puzzle = function() {
  var p = Puzzles.findOne();
  if (p) {
    Session.set('puzzleid', p._id);
    Session.set('selected-row', 0);
    Session.set('selected-column', -1);
    move(0, 1);
  }
}

Meteor.startup(function() {
  $('body').on('keydown', handle_key);
  if (!active_puzzle()) {
    new_puzzle();
  }
});
