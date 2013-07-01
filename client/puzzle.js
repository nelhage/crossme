Deps.autorun(function () {
  Meteor.subscribe('puzzles');
  var id = Session.get('gameid');
  if (id)
    Meteor.subscribe('game', id);
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
  return Clues.findOne({puzzle:s.puzzle,
                        direction: dir,
                        number: selected_square()['word_' + dir]});
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
  var dst = find(puz, row+dr, col+dc, dr, dc, function (s) {
    return !s.black;
  });
  if (!dst) return false;
  select(dst);
  return false;
}

function letter(keycode) {
  var s = String.fromCharCode(keycode);
  var square = selected_square();
  var id = Fills.findOne({square: square._id, game: Session.get('gameid')})._id;
  Fills.update({_id: id}, {$set: {letter: s}});
  if (Session.get('selected-direction') == 'across')
    move(0, 1);
  else
    move(1, 0);
  return false;
}

function clearFill() {
  var square = selected_square();
  var id = Fills.findOne({square: square._id, game: Session.get('gameid')})._id;
  Fills.update({_id: id}, {$set: {letter: null}});
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

function tabKey() {
  var square = selected_square();
  var dr = 0, dc = 0;
  if (Session.get('selected-direction') === 'down')
    dr = 1;
  else
    dc = 1;
  var sel, clue, dst, h;
  clue = sel = selected_clue();
  do {
    clue = Clues.findOne({number: {$gt: clue.number}, puzzle: sel.puzzle, direction: sel.direction},
                         {sort: {number: 1}});
    if (!clue)
      clue = Clues.findOne({puzzle: sel.puzzle, direction: sel.direction},
                           {sort: {number: 1}});
    h = {puzzle: clue.puzzle};
    h['word_' + clue.direction] = clue.number;
    dst = find_blank_in_word(Squares.findOne(h), dr, dc);
    if (dst) {
      select (dst);
      return false;
    }
  } while(clue._id != sel._id)
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
  else if (k.keyCode === 9)
    return tabKey();
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
  Session.set('selected-row', 0);
  Session.set('selected-column', 0);
  Session.set('selected-direction', 'across');
  history.pushState(null, '', '/game/' + id);
}

Meteor.startup(function() {
  $('body').on('keydown', handle_key);
  var m = document.location.pathname.match(/^\/game\/(\w+)$/);
  if (m) {
    load_game(m[1]);
  }
});
