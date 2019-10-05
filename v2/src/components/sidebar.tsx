import React from "react";

import Nav from "react-bootstrap/Nav";

import { Reveal } from "./controls/reveal";
import { Check } from "./controls/check";
import { Pencil } from "./controls/pencil";
import { Rebus } from "./controls/rebus";

interface SidebarProps {
  doReveal?: any;
  doCheck?: any;
}

export const Sidebar: React.FC<SidebarProps> = props => {
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
          <Pencil isPencil={false} />
        </Nav.Item>
        <Nav.Item>
          <Rebus active={false} />
        </Nav.Item>
      </Nav>
    </div>
  );
  /*
        <li className="player-label"> Now playing:</li>
        <li>
          <PlayerListContainer gameId={props.gameId} />
        </li>
        <KeyboardShortcuts />
      <UserPreferences currentUser={props.currentUser} />
      */
};
