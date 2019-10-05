import React from "react";

import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";

export interface CheckProps {
  doCheck?: any;
}

export const Check: React.FC<CheckProps> = props => {
  return (
    <DropdownButton title="Check" id="dCheck" /* onSelect={this.onSelect} */>
      <Dropdown.Item data-target="square">Square</Dropdown.Item>
      <Dropdown.Item data-target="word">Word</Dropdown.Item>
      <Dropdown.Item data-target="grid">Grid</Dropdown.Item>
    </DropdownButton>
  );
};
