Meteor.publish('puzzles', function () {
  return Puzzles.find();
});

Meteor.publish('game', function (gameid) {
  var game = Games.findOne({_id: gameid});
  if (game) {
    return [ Games.find({_id: gameid}),
             Clues.find({puzzle: game.puzzle}),
             Squares.find({puzzle: game.puzzle}),
             Fills.find({game: game._id}),
             Meteor.users.find({_id: {$in: (game.players||[]).map(function (u){return u.userId;})}},
                               {fields: {username: 1, profile: 1}})];
  } else {
    return [];
  }
});

Clues._ensureIndex([['puzzle', 1], ['direction', 1], ['number', 1]]);
Squares._ensureIndex([['puzzle', 1], ['row', 1], ['column', 1]]);
Squares._ensureIndex([['puzzle', 1], ['number', 1]]);
Fills._ensureIndex([['game', 1], ['square', 1]]);
