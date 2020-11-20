import React from "react";

import classNames from "classnames";

import * as Types from "../types";

export interface ClueProps {
  number: number;
  text: string;
  direction: Types.Direction;
  selected: boolean;
  className: string;

  onClick: (evt: Types.SelectClueEvent) => void;
}

function scrollIntoView(node: null | HTMLElement) {
  if (node === null) {
    return;
  }
  const nodeRect = node.getBoundingClientRect();
  const parentNode = node.parentNode as HTMLElement;
  const parentRect = parentNode.getBoundingClientRect();
  if (nodeRect.top >= parentRect.top && nodeRect.bottom <= parentRect.bottom) {
    return;
  }
  parentNode.scrollTop = node.offsetTop - parentNode.offsetTop;
}

export const Clue: React.FC<ClueProps> = React.memo(props => {
  const classes = classNames("clue", `clue-${props.number}`, props.className);
  const onClick = (evt: React.MouseEvent<HTMLDivElement>) => {
    const target = evt.target as HTMLDivElement;
    props.onClick({
      number: parseInt(target.dataset.number as string, 10),
      direction: target.dataset.direction as Types.Direction
    });
  };
  return (
    <div
      role="button"
      className={classes}
      onClick={onClick}
      data-number={props.number}
      data-direction={props.direction}
      ref={props.selected ? scrollIntoView : undefined}
    >
      {props.number}. {props.text}
    </div>
  );
});
