Meteor.publish('puzzles', function () {
  var cursors = [Puzzles.find()];
  if (this.userId) {
    cursors.push(Games.find({'players.userId': this.userId}));
  }
  return cursors;
});

function publishPlayers(handle, gameid) {
  var userObserver = null;
  var watchPlayers = function(doc) {
    var uids = (doc.players||[]).map(function (u){return u.userId;});
    if (userObserver)
      userObserver.stop();
    userObserver = Meteor.users.find({_id: {$in: uids}},
                                     {fields: {username: 1, profile: 1}}).
      observeChanges({
          added: function (id, doc) {
            handle.added(Meteor.users._name, id, doc);
          },
          changed: function (id, doc) {
            handle.added(Meteor.users._name, id, doc);
          },
          removed: function (id, doc) {
            handle.removed(Meteor.users._name, id, doc);
          }
      });
  }
  var observer = Games.find({_id: gameid}).observe({
      added: function (doc) {
        watchPlayers(doc);
      },
      changed: function (doc) {
        watchPlayers(doc);
      }
  });
  handle.ready();
  handle.onStop(function () {
    observer.stop();
    if (userObserver)
      userObserver.stop();
  });
}

Meteor.publish('game', function (gameid) {
  var game = Games.findOne({_id: gameid});
  if (!game) {
    return;
  }
  publishPlayers(this, gameid);
  return [ Games.find({_id: gameid}),
             Clues.find({puzzle: game.puzzle}),
             Squares.find({puzzle: game.puzzle}),
             Fills.find({game: game._id}) ];
});

Meteor.publish('puzzle', function (puzid) {
  return [
    Clues.find({puzzle: puzid}),
    Squares.find({puzzle: puzid})
  ];
});

Clues._ensureIndex([['puzzle', 1], ['direction', 1], ['number', 1]]);
Squares._ensureIndex([['puzzle', 1], ['row', 1], ['column', 1]]);
Squares._ensureIndex([['puzzle', 1], ['number', 1]]);
Fills._ensureIndex([['game', 1], ['square', 1]]);
