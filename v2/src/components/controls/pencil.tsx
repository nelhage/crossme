import React from "react";

import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";

export interface PencilProps {
  isPencil: boolean;
}

export const Pencil: React.FC<PencilProps> = props => {
  const onChange = () => null;

  return (
    <ButtonToolbar>
      <ToggleButtonGroup
        type="radio"
        name="options"
        value={props.isPencil}
        onChange={onChange}
      >
        <ToggleButton value={false}>Pen</ToggleButton>
        <ToggleButton value={true}>Pencil</ToggleButton>
      </ToggleButtonGroup>
    </ButtonToolbar>
  );
};
