import React from "react";

import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";

export interface RebusProps {
  active: boolean;
}

export const Rebus: React.FC<RebusProps> = props => {
  return (
    <ButtonGroup>
      <Button
      /* onClick={this.click.bind(this)} */
      >
        Rebus
      </Button>
    </ButtonGroup>
  );
};
