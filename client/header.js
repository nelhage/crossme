/* eslint-disable */

import {
  UserInfo,
  RecentGames,
} from '../imports/components/header.jsx';

Template.header.helpers({
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

  UserInfo: function() { return UserInfo; },
  RecentGames: function() { return RecentGames; }
});

Template.selector.helpers({
  puzzles: function() {
    return Puzzles.find().fetch();
  }
});

Template.selector.events({
  'click .btn-primary': function() {
    var id = $('#switchpuzzle').val();
    Meteor.call('newGame', id, function (error, id) {
      if (!error)
        load_game(id);
    });
    $('#new-game-modal').modal('hide');
    return false;
  },
  'click .btn-preview': function() {
    var id = $('#switchpuzzle').val();
    load_preview(id);
    $('#new-game-modal').modal('hide');
    return false;
  }
});

function fail(err) {
  window.the_error = err;
  alert(err);
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

function handleUpload() {
  var files = $('#puzfile')[0].files;
  if (!files.length)
        return fail("You must select a file.");
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

Template.upload.events({
  'click button': function() {
    $('#new-game-modal').modal('hide');
    handleUpload();
    return false;
  }
});
