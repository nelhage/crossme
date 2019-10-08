import React from "react";
import classNames from "classnames";

import * as Types from "../types";

export enum InWord {
  SELECTED,
  IN_WORD,
  OTHER_WORD
}

export interface PuzzleCellProps {
  square: Types.Cell;
  row: number;
  column: number;

  fill?: Types.FillState;

  onClick: (evt: React.MouseEvent<HTMLDivElement>) => void;
  onInput?: (text: string) => void;

  inword?: InWord;
}

interface PuzzleCellState {
  rebus?: boolean;
}

export class PuzzleCell extends React.PureComponent<
  PuzzleCellProps,
  PuzzleCellState
> {
  constructor(props: PuzzleCellProps) {
    super(props);
    this.state = { rebus: false };
    this.closeRebus = this.closeRebus.bind(this);
  }

  static getDerivedStateFromProps(props: PuzzleCellProps): PuzzleCellState {
    if (props.inword !== InWord.SELECTED) {
      return { rebus: false };
    }
    return {};
  }

  computeClasses() {
    if (this.props.square.black) {
      throw new Error("can't compute classes for black cell");
    }
    const classes: { [cls: string]: boolean | undefined } = {
      circled: this.props.square.circled,
      pencil: this.props.fill && this.props.fill.pencil,
      reveal: this.props.fill && this.props.fill.revealed,
      wrong:
        this.props.fill && this.props.fill.checked && !this.props.fill.correct,
      checked: this.props.fill && this.props.fill.checked,
      correct: this.props.fill && this.props.fill.correct
    };
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
    if (
      this.props.fill &&
      this.props.fill.fill &&
      this.props.fill.fill.length > 1
    ) {
      classes.rebus = true;
    }
    return classes;
  }

  closeRebus(evt: React.FocusEvent<HTMLInputElement>) {
    this.setState({ rebus: false });
    if (this.props.onInput) {
      this.props.onInput(evt.target.value.toUpperCase());
    }
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
        data-row={this.props.row}
        data-column={this.props.column}
        onClick={this.state.rebus ? undefined : this.props.onClick}
        className={classNames("cell", classes)}
      >
        <div className="circle">
          {this.props.square.number && (
            <div className="numberlabel">{this.props.square.number}</div>
          )}
          <div className="cellbody">
            {this.state.rebus ? (
              <input
                className="fill"
                defaultValue={this.props.fill && this.props.fill.fill}
                onBlur={this.closeRebus}
                autoFocus={true}
              />
            ) : (
              <div className="fill">
                {this.props.fill && this.props.fill.fill}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
