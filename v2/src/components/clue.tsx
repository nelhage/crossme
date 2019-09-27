import React from "react";

import classNames from "classnames";

import { Direction } from "../types";

export interface ClueProps {
  number: number;
  text: string;
  direction: Direction;
  selected: boolean;
  className: string;
}

export class Clue extends React.PureComponent<ClueProps> {
  scrollIntoView(node: null | HTMLElement) {
    if (node === null) {
      return;
    }
    const nodeRect = node.getBoundingClientRect();
    const parentNode = node.parentNode as HTMLElement;
    const parentRect = parentNode.getBoundingClientRect();
    if (nodeRect.bottom < parentRect.top || nodeRect.top > parentRect.bottom) {
      parentNode.scrollTop = node.offsetTop - parentNode.offsetTop;
    }
  }

  render() {
    const classes = classNames(
      "clue",
      `clue-${this.props.number}`,
      this.props.className
    );
    return (
      <div
        role="button"
        className={classes}
        // onClick={this.props.onClick}
        data-number={this.props.number}
        data-direction={this.props.direction}
        ref={this.props.selected ? this.scrollIntoView : undefined}
      >
        {this.props.number}. {this.props.text}
      </div>
    );
  }
}
