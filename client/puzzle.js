/* eslint-disable */

import App from "../imports/components/app.jsx";

FillsBySquare = new SecondaryIndex(Fills, ["square", "game"]);
SquaresByPosition = new SecondaryIndex(Squares, ["puzzle", "row", "column"]);

Deps.autorun(function () {
  Meteor.subscribe('puzzles');
  var id = Session.get('gameid');
  if (id)
    Meteor.subscribe('game', id);
  var puz = Session.get('previewid');
  if (puz)
    Meteor.subscribe('puzzle', puz);
});

window.active_puzzle = function() {
  var id = puzzle_id();
  return id && Puzzles.findOne({_id: id});
}

function puzzle_id() {
  if (Session.get('previewid'))
    return Session.get('previewid');
  var id = Session.get('gameid');
  var game = id && Games.findOne({_id: id});
  return game && game.puzzle;
}

function selected_square() {
  return SquaresByPosition.find(
    {
      puzzle: puzzle_id(),
      row: Session.get('selected-row'),
      column: Session.get('selected-column')
    });
}

function selected_clue() {
  var s = selected_square();
  var dir = Session.get('selected-direction');
  return s && Clues.findOne({puzzle: s.puzzle,
                             direction: dir,
                             number: selected_square()['word_' + dir]});
}

function isPencil() {
  return Session.equals('pencil', true);
}

Template.app.helpers({
  puzzleId: function() {
    return puzzle_id();
  },
  gameId: function() {
    return Session.get('gameid');
  },
  checkOk: function() {
    return !!Session.get('check-ok');
  },

  doReveal: function() { return doReveal; },
  doCheck: function() { return doCheck; },

  handleUpload: function() { return handleUpload },

  App: function() { return App; }
});

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
  Session.set('check-ok', null);
  if (!Session.get('selected-direction'))
    Session.set('selected-direction', 'across');
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
    s = SquaresByPosition.find({row: row, column: col, puzzle: puz._id});
    if (!s)
      return null;
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

function find_blank_in_word(square, dr, dc) {
  return find(Puzzles.findOne(square.puzzle),
              square.row, square.column, dr, dc, function (s) {
    if (s.black)
      return null;
    else if ((dc && (square.word_across !== s.word_across)) ||
             (dr && (square.word_down !== s.word_down)))
      return false;
    var f = FillsBySquare.find({square: s._id, game: Session.get('gameid')});
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
    clue = Clues.findOne({puzzle: sel.puzzle, direction: sel.direction === 'down' ? 'across' : 'down'},
                           {sort: {number: sort}});
  var h = {puzzle: clue.puzzle};
  h['word_' + clue.direction] = clue.number;
  var s = Squares.findOne(h);
  s = find_blank_in_word(s, dr, dc) || s;
  select(s);
  Session.set('selected-direction', clue.direction);
  return false;
}

function handle_key(k) {
  if (k.target.nodeName.toLowerCase() === 'input')
    return true;

  if (k.altKey || k.ctrlKey || k.metaKey)
    return true;

  if (!Session.get('gameid'))
    return true;
  else if (k.keyCode === 9)
    return tabKey(k);
  else if (k.keyCode === 191 && k.shiftKey) {
    toggleKeyboardShortcuts();
    return false;
  } else if (k.keyCode === 27 && showingKeyboardShortcuts()) {
    hideKeyboardShortcuts();
    return false;
  }

  return true;
}

window.load_game = function(id) {
  Router.go('game', {id: id});
}

window.load_preview = function(id) {
  Router.go('preview', {id: id});
}

function puzzleState() {
  return {
    game: Session.get('gameid'),
    square: selected_square()._id,
    direction: Session.get('selected-direction')
  };
}

function showingKeyboardShortcuts() {
  return $('#shortcuts-help').is(':visible');
}

function hideKeyboardShortcuts() {
  return $('#shortcuts-help').hide();
}

function doReveal(eventKey, e) {
  var target = $(e.currentTarget).data('target');
  Meteor.call('reveal', puzzleState(), target);
  return true;
}

function doCheck(eventKey, e) {
  var target = $(e.currentTarget).data('target');
  Meteor.call('check', puzzleState(), target, function (error, square) {
    if (error === undefined) {
      if (square) {
        select(Squares.findOne({_id: square}));
        Session.set('check-ok', false);
      } else {
        Session.set('check-ok', true);
      }
    }
  });
}

function handleUpload(files) {
  var i = 0;
  var uploadNext = function(error, id) {
    if (error) {
      window.the_error = error;
      alert("Error uploading: " + files[i].name + ": " + error);
    } else {
      if (i === files.length - 1) {
        load_preview(id);
      } else {
        i++;
        uploadFile(files[i], uploadNext);
      }
    }
  }
  uploadFile(files[0], uploadNext);
}

function uploadFile(file, cb) {
    var fr = new FileReader();
    fr.onerror = function() {
        cb(fr.error, null);
    };
    fr.onload = function() {
        Meteor.call('uploadPuzzle', fr.result, function (error, id) {
            cb(error, id);
        });
    };
    fr.readAsBinaryString(file);
}

function maybePing() {
  if (Meteor.userId() && Session.get('gameid')) {
    Meteor.call('ping', Session.get('gameid'));
  }
}

Meteor.startup(function() {
  $('body').on('keydown', handle_key);
  Meteor.setInterval(maybePing, 30 * 1000);
});

Deps.autorun(maybePing);
