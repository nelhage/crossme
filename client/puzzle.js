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
  if (!Session.get('selected-direction'))
    Session.set('selected-direction', 'across');
  scroll_into_view($('#clues .across .clue.clue-'+ square.word_across));
  scroll_into_view($('#clues .down .clue.clue-' + square.word_down));
  return false;
}

function puzzleState() {
  return {
    game: Session.get('gameid'),
    square: selected_square()._id,
    direction: Session.get('selected-direction')
  };
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
      }
    }
  });
}

function handleUpload(files) {
  var i = 0;
  var uploadNext = function(error, id) {
    if (error) {
      alert("Error uploading: " + files[i].name + ": " + error);
    } else {
      if (i === files.length - 1) {
        Router.go('preview', {id: id});
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
  Meteor.setInterval(maybePing, 30 * 1000);
});

Deps.autorun(maybePing);
