import React from "react";

import { Clue, Direction } from "../types";

export interface CurrentClueProps {
  clue: Clue;
  direction: Direction;
}

export const CurrentClue: React.FC<CurrentClueProps> = ({
  clue,
  direction
}) => (
  <div id="theclue">
    <span className="badge badge-secondary">
      <span className="number">{clue.number}</span>
      <span className="direction"> {direction}</span>
    </span>
    <span className="text">{clue.text}</span>
    <div className="clear" />
  </div>
);
