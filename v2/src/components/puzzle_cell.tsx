import React from "react";
import classNames from "classnames";

import { Cell } from "../types";

interface PuzzleCellProps {
  square: Cell;
  fill?: string;
}

export class PuzzleCell extends React.PureComponent<PuzzleCellProps> {
  computeClasses() {
    if (this.props.square.black) {
      throw new Error("can't compute classes for black cell");
    }
    const classes = {
      circled: this.props.square.circled
      /*
  selected: this.props.selected,
      inword: this.props.inWord,
      otherword: this.props.otherWord,
      reveal: this.props.fill.reveal,
      wrong: (this.props.fill.checked === 'checking'),
      checked: (this.props.fill.checked === 'checked'),
      correct: (this.props.fill.correct && this.props.letter === this.props.fill.letter),
      pencil: this.props.fill.pencil,
      rebus: this.props.fill.letter && this.props.fill.letter.length > 1,
      */
    };

    return classes;
  }

  render() {
    if (this.props.square.black) {
      return (
        <div role="button" className="cell filled">
          <div className="cellbody"></div>
        </div>
      );
    }

    const classes = this.computeClasses();

    /* eslint-disable jsx-a11y/no-autofocus */
    return (
      <div
        role="button"
        className={classNames("cell", classes)}
        // onClick={!this.props.rebus && this.props.onClick}
      >
        <div className="circle">
          {this.props.square.clue && (
            <div className="numberlabel">{this.props.square.clue}</div>
          )}
          <div className="cellbody">
            {this.props.fill && this.props.fill.length > 1 ? (
              <input
                className="fill"
                defaultValue={this.props.fill}
                // onBlur={this.setSquare}
                autoFocus={true}
              />
            ) : (
              <div className="fill">{this.props.fill}</div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
