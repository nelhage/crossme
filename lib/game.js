Meteor.methods({newGame: function (puzid) {
  var puz = Puzzles.findOne({_id: puzid});
  if (!puz)
    throw new Error("Unknown puzzle: " + puz);
  var gid = Games.insert({puzzle: puzid, created: new Date()});
  Squares.find({puzzle: puzid}).forEach(function (square) {
    Fills.insert({puzzle: square.puzzle, letter: null, square: square._id, game: gid});
  });
  return gid;
}});
