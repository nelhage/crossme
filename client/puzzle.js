function active_puzzle() {
  var id = Session.get('puzzleid');
  if (!id) return null;
  return Puzzles.findOne({_id: id});
}

Template.puzzle.show = function() {
  return !!active_puzzle();
}

Template.puzzle.title = function() {
  return active_puzzle().title;
}

Template.puzzle.author = function() {
  return active_puzzle().author;
}

Template.puzzle.rows = function() {
  var rows = [];
  var puz = active_puzzle();
  for (var r = 0; r < puz.height; r++) {
    rows.push({puzzle: puz, row: r});
  }
  return rows;
}

function scroll_into_view(e) {
  if (e.length) {
    var r = e[0].getClientRects()[0];
    if (document.elementFromPoint(r.left, r.top) !== e[0] ||
        document.elementFromPoint(r.right, r.bottom) !== e[0])
      e[0].scrollIntoView();
  }
}

function select(square) {
  Session.set('selected-row', square.row);
  Session.set('selected-column', square.column);
  Session.set('word-across', square.word_across);
  Session.set('word-down', square.word_down);
  scroll_into_view($('#clues .across .clue.clue-' +square.word_across));
  scroll_into_view($('#clues .down .clue.clue-' +square.word_down));
  return false;
}

function move(dr, dc) {
  if (Session.get('selected-direction') === 'across' && dr) {
    Session.set('selected-direction', 'down');
    return false;
  } else if (Session.get('selected-direction') === 'down' && dc) {
    Session.set('selected-direction', 'across');
    return false;
  }

  Session.set('selected-direction', dr ? 'down' : 'across');

  var row = Session.get('selected-row') || 0,
      col = Session.get('selected-column') || 0;
  var puz = active_puzzle();
  while (true) {
    row += dr;
    col += dc;
    if (row < 0 || row >= puz.height ||
        col < 0 || col >= puz.width)
      return;
    if (!Squares.findOne({row: row, column: col, puzzle: puz._id}).black)
      break;
  }
  var s = Squares.findOne({row: row, column: col, puzzle: puz._id});
  select(s);
  return false;
}

function letter(keycode) {
  var s = String.fromCharCode(keycode);
  var square = Squares.findOne({
                                 puzzle: Session.get('puzzleid'),
                                 row: Session.get('selected-row'),
                                 column: Session.get('selected-column')
                               });
  var id = Fills.findOne({square: square._id})._id;
  Fills.update({_id: id}, {$set: {letter: s}});
  if (Session.get('selected-direction') == 'across')
    move(0, 1);
  else
    move(1, 0);
  return false;
}

function clearFill() {
  var square = Squares.findOne({
                                 puzzle: Session.get('puzzleid'),
                                 row: Session.get('selected-row'),
                                 column: Session.get('selected-column')
                               });
  var id = Fills.findOne({square: square._id})._id;
  Fills.update({_id: id}, {$set: {letter: null}});
  return false;
}

function handle_key(k) {
  if (k.altKey || k.ctrlKey)
    return true;
  if (k.keyCode === 39)
    return move(0, 1);
  else if (k.keyCode === 37)
    return move(0, -1);
  else if (k.keyCode === 38)
    return move(-1, 0);
  else if(k.keyCode === 40)
    return move(1, 0);
  else if (k.keyCode >= 'A'.charCodeAt(0) && k.keyCode <= 'Z'.charCodeAt(0))
    return letter(k.keyCode);
  else if (k.keyCode === ' '.charCodeAt(0) ||
           k.keyCode === 8 ||
           k.keyCode === 46)
    return clearFill();
  return true;
}

Template.row.cells = function() {
  return Squares.find({puzzle: this.puzzle._id, row: this.row},{sort: {column: 1}}).fetch();
}

Template.cell.number = function() {
  return this.number;
}

Template.cell.fill = function() {
  var f = Fills.findOne({square: this._id});
  return f.letter || '';
}

Template.cell.events({
  'click': function () {
    if (!this.black)
      select(this);
  }
});

Template.cell.css_class = function() {
  var classes = []
  if (this.black)
    classes.push("filled");
  var sel;
  if (Session.equals('selected-row', this.row) &&
      Session.equals('selected-column', this.column))
    classes.push('selected');
  else if (Session.equals('word-across', this.word_across))
      classes.push(Session.equals('selected-direction', 'across') ? 'inword' : 'otherword');
  else if (Session.equals('word-down', this.word_down))
      classes.push(Session.equals('selected-direction', 'down') ? 'inword' : 'otherword');
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

Template.clue.events({
  'click': function() {
    var s = Squares.findOne({puzzle: this.puzzle, number: this.number});
    Session.set('selected-direction', this.direction);
    select(s);
  }
})

Template.clue.css_class = function() {
  var classes = ['clue-' + this.number];
  if (Session.equals('word-' + this.direction, this.number)) {
    if (Session.equals('selected-direction', this.direction))
      classes.push('selected');
    else
      classes.push('otherword');
  }
  return classes.join(' ');
}

window.new_puzzle = function() {
  var p = Puzzles.findOne();
  if (p) {
    Session.set('puzzleid', p._id);
    Session.set('selected-row', 0);
    Session.set('selected-column', -1);
    Session.set('selected-direction', 'across');
    move(0, 1);
  }
}

Meteor.startup(function() {
  $('body').on('keydown', handle_key);
  if (!active_puzzle()) {
    new_puzzle();
  }
});
