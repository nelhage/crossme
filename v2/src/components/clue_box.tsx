import React from "react";

import { Puzzle, Direction } from "../types";
import { ClueGroup } from "./clue_group";

export interface ClueBoxProps {
  puzzle: Puzzle;
  across_clue: number;
  down_clue: number;
  direction: Direction;
}

export const ClueBox: React.FC<ClueBoxProps> = props => (
  <div id="clues" className="visible-md-inline-block visible-lg-inline-block">
    <div className="section across">
      <div className="title"> Across </div>
      <ClueGroup
        active={props.direction === Direction.ACROSS}
        direction={Direction.ACROSS}
        selected={props.across_clue}
        clues={props.puzzle.across_clues}
      />
    </div>
    <div className="section down">
      <div className="title"> Down </div>
      <ClueGroup
        active={props.direction === Direction.DOWN}
        direction={Direction.DOWN}
        selected={props.down_clue}
        clues={props.puzzle.down_clues}
      />
    </div>
  </div>
);
