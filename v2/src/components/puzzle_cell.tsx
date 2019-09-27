import React from "react";
import classNames from "classnames";

import { Cell } from "../types";

export enum InWord {
  SELECTED,
  IN_WORD,
  OTHER_WORD
}

export interface PuzzleCellProps {
  square: Cell;
  onClick: () => any;
  fill?: string;

  inword?: InWord;
}

export class PuzzleCell extends React.PureComponent<PuzzleCellProps> {
  computeClasses() {
    if (this.props.square.black) {
      throw new Error("can't compute classes for black cell");
    }
    const classes = Object.create({
      circled: this.props.square.circled
      /*
      reveal: this.props.fill.reveal,
      wrong: (this.props.fill.checked === 'checking'),
      checked: (this.props.fill.checked === 'checked'),
      correct: (this.props.fill.correct && this.props.letter === this.props.fill.letter),
      pencil: this.props.fill.pencil,
      rebus: this.props.fill.letter && this.props.fill.letter.length > 1,
      */
    });
    switch (this.props.inword) {
      case InWord.SELECTED:
        classes.selected = true;
        break;
      case InWord.IN_WORD:
        classes.inword = true;
        break;
      case InWord.OTHER_WORD:
        classes.otherword = true;
    }

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
    const rebus = this.props.fill && this.props.fill.length > 1;
    return (
      <div
        role="button"
        onClick={rebus ? undefined : this.props.onClick}
        className={classNames("cell", classes)}
        // onClick={!this.props.rebus && this.props.onClick}
      >
        <div className="circle">
          {this.props.square.number && (
            <div className="numberlabel">{this.props.square.number}</div>
          )}
          <div className="cellbody">
            {rebus ? (
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
