import React from "react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";

export const Header: React.FC = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="md">
      <Navbar.Brand href="/">CrossMe</Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse>
        <Nav>
          <Nav.Link>New Game</Nav.Link>
          <NavDropdown
            title="Recent Games"
            id="recent-games-dropdown"
          ></NavDropdown>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );

  /*
        <Nav pullRight>
          <UserInfo currentUser={this.props.currentUser} />
        </Nav>
      */
};
