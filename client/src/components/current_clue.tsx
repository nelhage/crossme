import { Clue, Direction } from "../types";

export interface CurrentClueProps {
  clue: Clue;
  direction: Direction;
}

export const CurrentClue = ({ clue, direction }: CurrentClueProps) => (
  <div id="theclue">
    <span className="badge bg-secondary">
      <span className="number">{clue.number}</span>
      <span className="direction"> {direction}</span>
    </span>
    <span className="text">{clue.text}</span>
    <div className="clear" />
  </div>
);
