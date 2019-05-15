/* eslint-disable */

import App from "../imports/components/app.jsx";

FillsBySquare = new SecondaryIndex(Fills, ["square", "game"]);

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

Template.app.helpers({
  puzzleId: function() {
    return puzzle_id();
  },
  gameId: function() {
    return Session.get('gameid');
  },

  handleUpload: function() { return handleUpload },

  App: function() { return App; }
});

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
