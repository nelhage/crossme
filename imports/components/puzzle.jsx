import React from 'react';
import classNames from 'classnames';

/* eslint-disable import/prefer-default-export */

export class PuzzleGrid extends React.Component {
  cellProps(cell) {
    const cursor = this.props.cursor;
    const props = {
      key: cell._id,
      number: cell.number,
      black: cell.black,
      circled: cell.circled,
      fill: cell.fill,
      selected: (cursor.selected_row === cell.row &&
                 cursor.selected_column === cell.column),
      onClick: () => { this.props.onClickCell(cell); },
    };
    if (cursor.word_across === cell.word_across) {
      if (cursor.selected_direction === 'across') {
        props.inWord = true;
      } else {
        props.otherWord = true;
      }
    }
    if (cursor.word_down === cell.word_down) {
      if (cursor.selected_direction === 'down') {
        props.inWord = true;
      } else {
        props.otherWord = true;
      }
    }

    return props;
  }

  render() {
    const rows = this.props.grid.map((row, i) => {
      const cells = row.map(cell => <PuzzleCell {...this.cellProps(cell)} />);
      return (
        <div className="row" key={i}>
          {cells}
        </div>
      );
    });
    return (
      <div>
        {rows}
      </div>
    );
  }
}

class PuzzleCell extends React.Component {
  computeClasses() {
    if (this.props.black) {
      return 'filled';
    }
    const classes = {
      circled: this.props.circled,
      selected: this.props.selected,
      inword: this.props.inWord,
      otherword: this.props.otherWord,
      reveal: this.props.fill.reveal,
      wrong: (this.props.fill.checked === 'checking'),
      checked: (this.props.fill.checked === 'checked'),
      correct: (this.props.fill.correct && this.props.letter === this.props.fill.letter),
      pencil: this.props.fill.pencil,
    };

    return classes;
  }

  render() {
    const classes = this.computeClasses();

    return (
      <div className={classNames('cell', classes)} onClick={this.props.onClick} >
        <div className="circle">
          {this.props.number && (
            <div className="numberlabel">
              {this.props.number}
            </div>
          )}
          <div className="cellbody">
            <div className="fill">
              {this.props.fill.letter}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
