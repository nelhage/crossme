Meteor.publish('puzzles', function () {
  return Puzzles.find();
});

Meteor.publish('puzzle', function (puzid) {
  return [Clues.find({puzzle: puzid}),
          Squares.find({puzzle: puzid}),
          Fills.find({puzzle: puzid})];
});

Clues._ensureIndex([['puzzle', 1], ['direction', 1], ['number', 1]]);
Squares._ensureIndex([['puzzle', 1], ['row', 1], ['column', 1]]);
Squares._ensureIndex([['puzzle', 1], ['number', 1]]);
Fills._ensureIndex([['puzzle', 1]]);
Fills._ensureIndex([['square', 1]]);
