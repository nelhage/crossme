import React from "react";

import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";

import * as Crossword from "../../crossword";

export interface CheckProps {
  doCheck: (target: Crossword.Target) => void;
}

export const Check: React.FC<CheckProps> = props => {
  return (
    <DropdownButton title="Check" id="dCheck" onSelect={props.doCheck}>
      <Dropdown.Item active={false} eventKey={Crossword.Target.SQUARE}>
        Square
      </Dropdown.Item>
      <Dropdown.Item active={false} eventKey={Crossword.Target.WORD}>
        Word
      </Dropdown.Item>
      <Dropdown.Item active={false} eventKey={Crossword.Target.PUZZLE}>
        Grid
      </Dropdown.Item>
    </DropdownButton>
  );
};
