import React from "react";

import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";

export interface RebusProps {
  onClick: () => void;
}

export const Rebus: React.FC<RebusProps> = props => {
  return (
    <ButtonGroup>
      <Button onClick={props.onClick}>Rebus</Button>
    </ButtonGroup>
  );
};
