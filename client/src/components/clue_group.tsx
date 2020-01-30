import React from "react";

import * as Types from "../types";

import { Clue } from "./clue";

export interface ClueGroupProps {
  active: boolean;
  direction: Types.Direction;
  selected?: number;
  clues: Types.Clue[];

  onSelect: (evt: Types.SelectClueEvent) => void;
}

function classFor(selected: boolean, active: boolean): string {
  if (!selected) {
    return "";
  }
  if (active) {
    return "selected";
  }
  return "otherword";
}

export const ClueGroup: React.FC<ClueGroupProps> = ({
  active,
  direction,
  selected,
  clues,
  onSelect
}) => {
  const contents = clues.map(c => (
    <Clue
      key={c.number}
      number={c.number}
      text={c.text}
      direction={direction}
      selected={c.number === selected}
      className={classFor(c.number === selected, active)}
      onClick={onSelect}
    />
  ));

  return <div className="cluelist">{contents}</div>;
};
