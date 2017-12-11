/* eslint-disable */

function find_word(puz, cell) {
  var row = cell.row, col = cell.column;
  while (col > 0 && puz.solution[row][col - 1] !== null)
    col--;
  if (puz.numbers[row][col])
    cell.word_across = puz.numbers[row][col];
  col = cell.column;
  while (row > 0 && puz.solution[row - 1][col] !== null)
    row--;
  if (puz.numbers[row][col])
    cell.word_down = puz.numbers[row][col];
}

Meteor.methods({
    uploadPuzzle: function (buf) {
      var puz = new PuzFile(new Buffer(buf, 'binary'));
      var puzid;
      var existing = Puzzles.findOne({title: puz.title, author: puz.author});
      if (existing) {
        puzid =  existing._id;
      } else {
        puzid = Puzzles.insert({
          title: puz.title,
          author: puz.author,
          copyright: puz.copyright,
          note: puz.note,
          width: puz.width,
          height: puz.height
        });
      }
      for (var r = 0; r < puz.height; r++) {
        for (var c = 0; c < puz.width; c++) {
          var key = {
            puzzle: puzid,
            row: r,
            column: c
          };
          var h = _.clone(key);
          if (puz.circled[r][c]) {
            h.circled = true;
          }

          if (puz.solution[r][c] === null) {
            h.black = true;
          } else {
            find_word(puz, h);
            h.letter = puz.solution[r][c];
          };
          if (puz.numbers[r][c])
            h.number = puz.numbers[r][c];
          Squares.upsert(key, h);
        }
      }
      function store_clue(clue, index, direction) {
        if (clue) {
          const q = {
            puzzle: puzid,
            direction: direction,
            number: index
          };
          Clues.upsert(q, _.extend(q, { text: clue }));
        }
      }
      puz.down_clues.forEach(function (clue, index) {
        store_clue(clue, index, 'down');
      });
      puz.across_clues.forEach(function (clue, index) {
        store_clue(clue, index, 'across');
      });
      return puzid;
    }
});
