import Nav from "react-bootstrap/Nav";

import * as Crossword from "../crossword";

import { Reveal } from "./controls/reveal";
import { Check } from "./controls/check";
import { Pencil } from "./controls/pencil";
import { Rebus } from "./controls/rebus";

interface SidebarProps {
  pencil: boolean;

  doReveal: (target: Crossword.Target) => void;
  doCheck: (target: Crossword.Target) => void;

  setPencil: (arg: boolean) => void;
  openRebus: () => void;
}

export const Sidebar = (props: SidebarProps) => {
  return (
    <div id="controls">
      <Nav className="flex-lg-column">
        <Nav.Item>
          <Reveal doReveal={props.doReveal} />
        </Nav.Item>
        <Nav.Item>
          <Check doCheck={props.doCheck} />
        </Nav.Item>
        <Nav.Item>
          <Pencil isPencil={props.pencil} setPencil={props.setPencil} />
        </Nav.Item>
        <Nav.Item>
          <Rebus onClick={props.openRebus} />
        </Nav.Item>
      </Nav>
    </div>
  );
};
