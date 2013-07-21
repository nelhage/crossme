Meteor.methods({
  newGame: function (puzid) {
    var puz = Puzzles.findOne({_id: puzid});
    if (!puz)
      throw new Error("Unknown puzzle: " + puz);
    var gid = Games.insert({puzzle: puzid, created: new Date()});
    Squares.find({puzzle: puzid}).forEach(function (square) {
      Fills.insert({puzzle: square.puzzle, letter: null, square: square._id, game: gid});
    });
    return gid;
  },
  setLetter: function (game, square, letter) {
    var fill = Fills.findOne({square: square, game: game});
    if (fill && fill.letter !== letter)
    Fills.update({_id: fill._id}, {$set: {letter: letter}});
  },
  clearLetter: function (game, square) {
    var fill = Fills.findOne({square: square, game: game});
    if (fill && fill.letter)
      Fills.update({_id: fill.id}, {$set: {letter: null}});
  }
});
