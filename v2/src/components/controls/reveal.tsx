import React from "react";

import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";

export interface RevealProps {
  doReveal?: any;
}

export const Reveal: React.FC<RevealProps> = props => {
  return (
    <DropdownButton title="Reveal" id="dReveal" /* onSelect={this.onSelect} */>
      <Dropdown.Item data-target="square">Square</Dropdown.Item>
      <Dropdown.Item data-target="word">Word</Dropdown.Item>
      <Dropdown.Item data-target="grid">Grid</Dropdown.Item>
    </DropdownButton>
  );
};
