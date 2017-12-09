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

  selectedSquare() {
    const row = this.state.cursor.selected_row;
    const col = this.state.cursor.selected_column;
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
        const fill = this.state.fills[s._id];
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
        const fill = this.state.fills[s._id];
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
    if (this.state.cursor.selected_direction === 'across') {
      this.move(0, -1, true);
    } else {
      this.move(1, -0, true);
    }
  }

  letter(char) {
    const square = this.selectedSquare();
    this.delegate.setFill(square, char.toUpperCase());
    let dr = 0;
    let dc = 0;
    if (this.state.cursor.selection_direction === 'down') {
      dr = 1;
    } else {
      dc = 1;
    }
    const next = this.nextBlankInWord(square, dr, dc);
    if (next && this.state.profile.settingWithinWord === 'skip') {
      this.delegate.select(next);
      return;
    }
    if (!next && this.state.profile.settingEndWordBack) {
      const first = this.firstBlankInWord(square, dr, dc);
      if (first) {
        this.delegate.select(first);
        return;
      }
    }
    if (this.state.cursor.selected_direction === 'across') {
      this.move(0, 1, true);
    } else {
      this.move(1, 0, true);
    }
  }
}
