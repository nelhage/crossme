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
Deps.autorun(function () {
  if (Session.get('gameid') && puzzle_id()) {
    var s = selected_square();
    if (!s || s.black) {
      s = find(active_puzzle(), 0, 0, 0, 1, function (s) { return !s.black });
      if (s) {
        select(s);
      }
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


function selectClue(number, direction) {
  var s = Squares.findOne({puzzle: puzzle_id(), number: number});
  Session.set('selected-direction', direction);
  select(s);
}

Template.app.helpers({
  puzzle: active_puzzle,
  checkOk: function() {
    return !!Session.get('check-ok');
  },
  isPencil: function() {
    return !!isPencil();
  },
  players: function() {
    var id = Session.get('gameid');
    var game = id && Games.findOne({_id: id});
    if (!game || !game.players) {
      return [];
    }
    return game.players.map(function (who) {
      // Apparently {{each}} requires every element you return to have an _id.
      who._id = who.userId;
      who.user = Meteor.users.findOne({_id: who.userId});
      who.isMe = (who.user._id === Meteor.userId());
      return who;
    });
  },

  doReveal: function() { return doReveal; },
  doCheck: function() { return doCheck; },

  cursor: function() {
    return {
      selected_row: Session.get('selected-row'),
      selected_column: Session.get('selected-column'),
      selected_direction: Session.get('selected-direction'),
      word_across: Session.get('word-across'),
      word_down: Session.get('word-down'),
    };
  },

  gridState: function() {
    let rows = [];
    let puz = active_puzzle();
    if (!puz)
      return null;

    let gameId = Session.get('gameid');

    for (var r = 0; r < puz.height; r++) {
      let cells = Squares.find({puzzle: puz._id, row: r},{sort: {column: 1}});
      rows.push(cells.map((cell) => {
        let fill = FillsBySquare.find({square: cell._id, game: gameId});
        cell.fill = fill || {};
        return cell;
      }));
    }
    return rows;
  },

  onClickCell: function() {
    return clickCell;
  },

  preview: function() {
    return !!Session.get('previewid');
  },

  currentClue: selected_clue,

  clues: function() {
    return {
      across: Clues.find({puzzle: puzzle_id(), direction: 'across'}, {sort: {number: 1}}),
      down: Clues.find({puzzle: puzzle_id(), direction: 'down'}, {sort: {number: 1}}),
    };
  },

  selectClue: function() {
    return selectClue;
  },

  recentGames: function() {
    return Games.find({'players.userId': Meteor.userId()},
      {
        sort: {created: -1},
        limit: 10
      }).map((game) => {
        const title = Puzzles.findOne({_id: game.puzzle}).title;
        const me = _.find(game.players, function(p) { return p.userId === Meteor.userId()});
        const lastSeen = me.lastSeen.toDateString();
        return {
          _id: game._id,
          title: title,
          lastSeen: lastSeen
        };
      });
  },

  puzzles: function() {
    return Puzzles.find().fetch();
  },

  handleUpload: function() { return handleUpload },

  App: function() { return App; }
});

function clickCell(cell) {
  if (!cell.black)
    select(cell);
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

function first_blank(word) {
  var h = {puzzle: word.puzzle}
  h['word_' + word.direction] = word.number;
  first = Squares.findOne(h);
  var dr = 0, dc = 0;
  if (Session.get('selected-direction') === 'down')
    dr = 1;
  else
    dc = 1;
  return find_blank_in_word(first, dr, dc) || false;
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
  Meteor.call('setLetter', Session.get('gameid'), square._id, s, isPencil());
  var dr = 0, dc = 0;
  if (Session.get('selected-direction') === 'down')
    dr = 1;
  else
    dc = 1;
  var sq = find_blank_in_word(square, dr, dc);
  var first = first_blank(selected_clue());
  if (sq && Meteor.user() && Meteor.user().profile.settingWithinWord == "skip")
    select(sq);
  else if (sq === null && first && Meteor.user() && Meteor.user().profile.settingEndWordBack)
    select(first);
  else if (Session.get('selected-direction') == 'across')
    move(0, 1, true);
  else
    move(1, 0, true);
  return false;
}

function clearCell() {
  var square = selected_square();
  Meteor.call('clearLetter', Session.get('gameid'), square._id);
  Session.set('check-ok', null);
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

  if (k.altKey && k.keyCode === 80) {
    Session.set('pencil', !Session.get('pencil'))
    return false;
  }
  if (k.altKey || k.ctrlKey || k.metaKey)
    return true;
  if ((k.keyCode === 39 || k.keyCode === 37) &&
      Session.get('selected-direction') === 'down' &&
      Meteor.user() &&
      Meteor.user().profile.settingArrows === "stay") {
    Session.set('selected-direction', 'across');
    return false;
  }
  else if ((k.keyCode === 38 || k.keyCode === 40) &&
           Session.get('selected-direction') === 'across' &&
           Meteor.user() &&
           Meteor.user().profile.settingArrows === "stay") {
    Session.set('selected-direction', 'down');
    return false;
  }
  else if (k.keyCode === 39)
    return move(0, 1);
  else if (k.keyCode === 37)
    return move(0, -1);
  else if (k.keyCode === 38)
    return move(-1, 0);
  else if (k.keyCode === 40)
    return move(1, 0);
  else if (k.keyCode === 13) {
    Session.set('selected-direction', Session.equals('selected-direction', 'across') ? 'down' : 'across');
    return false;
  }
  if (!Session.get('gameid'))
    return true;
  else if (k.keyCode >= 'A'.charCodeAt(0) && k.keyCode <= 'Z'.charCodeAt(0))
    return letter(k.keyCode);
  else if (k.keyCode === ' '.charCodeAt(0))
    return clearCell();
  else if (k.keyCode === 8 ||
           k.keyCode === 46)
    return deleteKey();
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
