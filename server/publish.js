Meteor.publish('puzzles', function () {
  return Puzzles.find();
});

Meteor.publish('game', function (gameid) {
  var game = Games.findOne({_id: gameid});
  if (game) {
    return [ Games.find({_id: gameid}),
             Clues.find({puzzle: game.puzzle}),
             Squares.find({puzzle: game.puzzle}),
             Fills.find({game: game._id}) ];
  } else {
    return [];
  }
});

Clues._ensureIndex([['puzzle', 1], ['direction', 1], ['number', 1]]);
Squares._ensureIndex([['puzzle', 1], ['row', 1], ['column', 1]]);
Squares._ensureIndex([['puzzle', 1], ['number', 1]]);
Fills._ensureIndex([['puzzle', 1]]);
Fills._ensureIndex([['square', 1]]);
