Deps.autorun(function () {
  Meteor.subscribe('puzzles');
  var id = Session.get('gameid');
  if (id)
    Meteor.subscribe('game', id);
});
Deps.autorun(function () {
  if (puzzle_id()) {
    var s = selected_square();
    if (!s || s.black) {
      s = find(active_puzzle(), 0, 0, 0, 1, function (s) { return !s.black });
      select(s);
    } else {
      Session.set('word-across', s.word_across);
      Session.set('word-down', s.word_down);
    }
  }
});

window.active_puzzle = function() {
  var id = puzzle_id();
  return id && Puzzles.findOne({_id: id});
}

function puzzle_id() {
  var id = Session.get('gameid');
  var game = id && Games.findOne({_id: id});
  return game && game.puzzle;
}

function selected_square() {
  return Squares.findOne({
                    puzzle: puzzle_id(),
                    row: Session.get('selected-row'),
                    column: Session.get('selected-column')
                  });
}

function selected_clue() {
  var s = selected_square();
  var dir = Session.get('selected-direction');
  return s && Clues.findOne({puzzle:s.puzzle,
                             direction: dir,
                             number: selected_square()['word_' + dir]});
}

Template.puzzle.show = function() {
  return !!active_puzzle();
}

Template.puzzle.puzzle = active_puzzle;

Template.currentclue.clue = selected_clue;

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
  scroll_into_view($('#clues .across .clue.clue-'+ square.word_across));
  scroll_into_view($('#clues .down .clue.clue-' + square.word_down));
  return false;
}

function find(puz, row, col, dr, dc, predicate) {
  var s;
  while (true) {
    if (row < 0 || row >= puz.height ||
        col < 0 || col >= puz.width)
      return null;
    s = Squares.findOne({row: row, column: col, puzzle: puz._id});
    if (predicate(s))
      return s;
    row += dr;
    col += dc;
  }
}

function move(dr, dc, inword) {
  Session.set('selected-direction', dr ? 'down' : 'across');

  var row = Session.get('selected-row') || 0,
      col = Session.get('selected-column') || 0;
  var puz = active_puzzle();
  var sel = selected_square();
  var dst = find(puz, row+dr, col+dc, dr, dc, function (s) {
    if (inword && ((dc && sel.word_across !== s.word_across) ||
                   (dr && sel.word_down   !== s.word_down)))
      return false;
    return !s.black;
  });
  if (!dst) return false;
  select(dst);
  return false;
}

function letter(keycode) {
  var s = String.fromCharCode(keycode);
  var square = selected_square();
  Meteor.call('setLetter', Session.get('gameid'), square._id, s);
  if (Session.get('selected-direction') == 'across')
    move(0, 1, true);
  else
    move(1, 0, true);
  return false;
}

function clearCell() {
  var square = selected_square();
  Meteor.call('clearLetter', Session.get('gameid'), square._id);
  return false;
}

function deleteKey() {
  clearCell();
  if (Session.get('selected-direction') == 'across')
    move(0, -1, true);
  else
    move(-1, 0, true);
  return false;
}

function find_blank_in_word(square, dr, dc) {
  return find(Puzzles.findOne(square.puzzle),
              square.row, square.column, dr, dc, function (s) {
    if (s.black ||
        (dc && (square.word_across !== s.word_across)) ||
        (dr && (square.word_down !== s.word_down)))
      return false;
    var f = Fills.findOne({square: s._id, game: Session.get('gameid')});
    return f && f.letter === null;
  });
}

function tabKey(k) {
  var dr = 0, dc = 0;
  if (Session.get('selected-direction') === 'down')
    dr = 1;
  else
    dc = 1;
  var sel = selected_clue();
  var cmp, sort;
  if (k.shiftKey) {
    cmp = '$lt';
    sort = -1;
  } else {
    cmp = '$gt';
    sort = 1;
  }
  var query = {};
  query[cmp] = sel.number;
  var clue = Clues.findOne({number: query, puzzle: sel.puzzle, direction: sel.direction},
                         {sort: {number: sort}});
  if (!clue)
    clue = Clues.findOne({puzzle: sel.puzzle, direction: sel.direction},
                           {sort: {number: sort}});
  var h = {puzzle: clue.puzzle};
  h['word_' + clue.direction] = clue.number;
  var s = Squares.findOne(h);
  s = find_blank_in_word(s, dr, dc) || s;
  select(s);
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
  else if (k.keyCode === ' '.charCodeAt(0))
    return clearCell();
  else if (k.keyCode === 8 ||
           k.keyCode === 46)
    return deleteKey();
  else if (k.keyCode === 9)
    return tabKey(k);
  return true;
}

Template.row.cells = function() {
  return Squares.find({puzzle: this.puzzle._id, row: this.row},{sort: {column: 1}}).fetch();
}

Template.cell.number = function() {
  return this.number;
}

Template.cell.fill = function() {
  var f = Fills.findOne({square: this._id, game: Session.get('gameid')});
  return f ? (f.letter || '') : '';
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
  else if (Session.equals('selected-row', this.row) &&
           Session.equals('selected-column', this.column))
    classes.push('selected');
  else if (Session.equals('word-across', this.word_across))
    classes.push(Session.equals('selected-direction', 'across') ? 'inword' : 'otherword');
  else if (Session.equals('word-down', this.word_down))
    classes.push(Session.equals('selected-direction', 'down') ? 'inword' : 'otherword');
  return classes.join(' ');
}

Template.clues.across_clues = function() {
  return Clues.find({puzzle: puzzle_id(), direction: 'across'}, {sort: {number: 1}});
}

Template.clues.down_clues = function() {
  return Clues.find({puzzle: puzzle_id(), direction: 'down'}, {sort: {number: 1}});
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

window.load_game = function(id) {
  Session.set('gameid', id);
  Meteor.Router.to('game', id);
}

Meteor.startup(function() {
  $('body').on('keydown', handle_key);
});
