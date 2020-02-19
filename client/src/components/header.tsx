import React from "react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";

import { NewGame } from "./new_game";
import { LoginButton } from "./login_button";

export interface HeaderProps {
  setUser: (user: null | gapi.auth2.GoogleUser) => void;
}

export const Header: React.FC<HeaderProps> = ({ setUser }) => {
  return (
    <Navbar bg="dark" variant="dark" expand="md">
      <Navbar.Brand href="/">CrossMe</Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse>
        <Nav className="mr-auto">
          <NewGame />
          <NavDropdown
            title="Recent Games"
            id="recent-games-dropdown"
          ></NavDropdown>
        </Nav>
        <Nav>
          <LoginButton setUser={setUser} />
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};
