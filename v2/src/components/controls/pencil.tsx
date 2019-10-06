import React from "react";

import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";

export interface PencilProps {
  isPencil: boolean;

  setPencil: (pencil: boolean) => void;
}

export const Pencil: React.FC<PencilProps> = props => {
  return (
    <ButtonToolbar>
      <ToggleButtonGroup
        type="radio"
        name="options"
        value={props.isPencil}
        onChange={props.setPencil}
      >
        <ToggleButton value={false}>Pen</ToggleButton>
        <ToggleButton value={true}>Pencil</ToggleButton>
      </ToggleButtonGroup>
    </ButtonToolbar>
  );
};
