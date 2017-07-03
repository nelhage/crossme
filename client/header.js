/* eslint-disable */

import Header from '../imports/components/header.jsx';

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

  puzzles: function() {
    return Puzzles.find().fetch();
  },

  handleUpload: function() { return handleUpload },

  Header: function() { return Header; }
});


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
