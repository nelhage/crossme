export default class Game {
  constructor(delegate, state) {
    this.delegate = delegate;
    this.state = state;
    /*
      state = {
        squares:,
        fill:,
        cursor:,
        profile:,
        clues:,
      }
     */
  }

  directionToDelta(direction) {
    if (direction === 'across') {
      return { dr: 0, dc: 1 };
    }
    return { dr: 1, dc: 0 };
  }

  selectedSquare() {
    const row = this.state.cursor.selected_row;
    const col = this.state.cursor.selected_column;
    if (typeof row === 'undefined' || typeof col === 'undefined') {
      return undefined;
    }
    return this.state.squares[row][col];
  }

  height() {
    return this.state.squares.length;
  }

  width() {
    return this.state.squares[0].length;
  }

  find(r, c, dr, dc, predicate) {
    let row = r;
    let col = c;
    /* eslint-disable no-constant-condition */
    while (true) {
      if (row < 0 || row >= this.height() ||
          col < 0 || col >= this.width()) {
        return null;
      }
      const s = this.state.squares[row][col];
      if (!s) {
        return null;
      }
      if (predicate(s)) {
        return s;
      }
      row += dr;
      col += dc;
    }
  }

  nextBlankInWord(square, dr, dc) {
    return this.find(
      square.row, square.column, dr, dc,
      (s) => {
        if (s.black) {
          return false;
        } else if ((dc && (square.word_across !== s.word_across)) ||
                   (dr && (square.word_down !== s.word_down))) {
          return false;
        }
        const fill = this.state.fills.get(s._id);
        return fill && fill.letter === null;
      });
  }

  firstBlankInWord(square, dr, dc) {
    let prev = null;
    this.find(
      square.row, square.column, -dr, -dc,
      (s) => {
        if (s.black) {
          return true;
        }
        const fill = this.state.fills.get(s._id);
        if (fill && fill.letter === null) {
          prev = s;
        }
        return false;
      });
    return prev;
  }

  move(dr, dc, inword) {
    const direction = dr ? 'down' : 'across';

    const row = this.state.cursor.selected_row;
    const col = this.state.cursor.selected_column;

    const sel = this.selectedSquare();
    const dst = this.find(row + dr, col + dc, dr, dc, function (s) {
      if (inword && ((dc && sel.word_across !== s.word_across) ||
                     (dr && sel.word_down !== s.word_down))) {
        return false;
      }
      return !s.black;
    });

    if (!dst) return;
    this.delegate.select(dst, direction);
  }

  /* UI handlers */
  switchDirection() {
    this.delegate.setDirection(
      this.state.cursor.selected_direction === 'across' ? 'down' : 'across',
    );
  }

  arrow(dr, dc) {
    if (this.state.profile.settingArrows === 'stay') {
      const direction = (dc !== 0) ? 'across' : 'down';
      if (direction !== this.state.cursor.selected_direction) {
        this.switchDirection();
        return;
      }
    }

    this.move(dr, dc);
  }

  clear() {
    this.delegate.clearFill(this.selectedSquare());
  }

  delete() {
    this.clear();
    const { dr, dc } = this.directionToDelta(this.state.cursor.selected_direction);
    this.move(-dr, -dc, true);
  }

  letter(char) {
    const square = this.selectedSquare();
    this.delegate.setFill(square, char.toUpperCase());
    const { dr, dc } = this.directionToDelta(this.state.cursor.selected_direction);

    const next = this.find(
      square.row + dr, square.column + dc, dr, dc,
      (sq) => {
        if (sq.black || this.state.profile.settingWithinWord !== 'skip') {
          return true;
        }
        const fill = this.state.fills.get(sq._id);
        if (!fill || !fill.letter) {
          return true;
        }
        return false;
      });
    if (next && !next.black) {
      this.delegate.select(next);
      return;
    }
    // At end of word
    if (this.state.profile.settingEndWordBack) {
      const first = this.firstBlankInWord(square, dr, dc);
      if (first) {
        this.delegate.select(first);
        return;
      }
    }
    if (this.state.profile.settingEndWordNext) {
      this.nextClue();
    }
  }

  nextClue(reverse) {
    const byNumber = {};

    // Build an index. We could cache this, but this way avoids
    // thinking about invalidation, and guarantees we only do the
    // O(n²) loop once per keypress, which is enough to be performant.
    this.state.squares.forEach((row) => {
      row.forEach((cell) => {
        if (cell.number) {
          byNumber[cell.number] = cell;
        }
      });
    });

    let direction = this.state.cursor.selected_direction;
    let clue = this.selectedSquare()[`word_${direction}`];
    const firstClue = clue;

    for (let i = 0; i < 4; i += 1) {
      const clues = this.state.clues[direction];

      while (clue >= 0 && clue <= clues.length) {
        if (reverse) {
          clue -= 1;
        } else {
          clue += 1;
        }

        if (!(clue in clues)) {
          continue;
        }

        const square = byNumber[clue];
        const { dr, dc } = this.directionToDelta(direction);
        const blank = this.nextBlankInWord(square, dr, dc);
        if (blank) {
          this.delegate.select(blank, direction);
          return;
        }
        if ((i === 2 && (reverse ? clue < firstClue : clue > firstClue)) || i === 3) {
          this.delegate.select(square, direction);
          return;
        }
      }

      direction = direction === 'across' ? 'down' : 'across';
      if (reverse) {
        clue = this.state.clues[direction].length;
      } else {
        clue = 0;
      }
    }
  }
}
