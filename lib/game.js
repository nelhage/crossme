function eachSquare(state, target, fn) {
  var square = Squares.findOne({_id: state.square});
  if (!square)
    throw new Error("No such square: " + state.square);
  var targets;
  if (target === 'grid') {
    targets = Squares.find({puzzle: square.puzzle}).fetch();
  } else if (target === 'word') {
    var q = {puzzle: square.puzzle};
    q['word_' + state.direction] = square['word_' + state.direction];
    targets = Squares.find(q).fetch();
  } else if (target === 'square') {
    targets = [square];
    var fill = Fills.findOne({square: state.square, game: state.game});
    fn(square, fill);
  } else {
    throw new Error("Unknown target: " + target);
  }
  targets.forEach(function (s) {
    var fill = Fills.findOne({square: s._id, game: state.game});
    fn(s, fill);
  });
}

function revealOne(square, fill) {
  if (fill.letter != square.letter) {
    Fills.update({_id: fill._id},
                 { $set: {
                     letter: square.letter,
                     reveal: true,
                     checked: fill.checked ? 'checked' : null
                   }
                 });
  }
}

function checkOne(square, fill) {
  if (fill.letter !== square.letter) {
    Fills.update({_id: fill._id},
                 { $set: {
                     checked: 'checking'
                   }});
    return false;
  }
  return true;
}

function setOne(game, square, letter) {
  var fill = Fills.findOne({square: square, game: game});
  if (fill && fill.letter !== letter) {
    var set = {letter: letter};
    if (fill.checked === 'checking')
      set.checked = 'checked';
    Fills.update({_id: fill._id}, {$set: set});
  }
}

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
    setOne(game, square, letter);
  },
  clearLetter: function (game, square) {
    setOne(game, square, null);
  },
  /*
   * state has keys:
   *  - game
   *  - square
   *  - direction
   */
  reveal: function (state, target) {
    eachSquare(state, target, revealOne);
  },
  check: function (state, target) {
    var ok = true;
    eachSquare(state, target, function (s,f) {
      ok = ok && checkOne(s, f);
    });
    return ok;
  }
});
