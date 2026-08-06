import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";

import { NewGame } from "./new_game";
import { RecentGames } from "./recent_games";

export const Header = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="md">
      <Container fluid>
        <Navbar.Brand href="/">CrossMe</Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            <NewGame />
            <RecentGames />
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
