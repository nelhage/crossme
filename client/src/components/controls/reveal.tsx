import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";

import * as Crossword from "../../crossword";

export interface RevealProps {
  doReveal: (target: Crossword.Target) => void;
}

export const Reveal = ({ doReveal }: RevealProps) => {
  return (
    <DropdownButton
      title="Reveal"
      id="dReveal"
      onSelect={(key) => key && doReveal(key as Crossword.Target)}
    >
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
