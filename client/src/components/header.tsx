import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";

import { Link } from "react-router";

import { useUser } from "../user";

import { Account } from "./account";
import { NewGame } from "./new_game";
import { RecentGames } from "./recent_games";

export const Header = () => {
  const { user } = useUser();
  return (
    <Navbar bg="dark" variant="dark" expand="md">
      <Container fluid>
        <Navbar.Brand href="/">CrossMe</Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            <NewGame />
            <RecentGames />
            {/* Anonymous play never reaches the server-side history,
                so the link would only ever show an empty page. */}
            {user && (
              <Nav.Link as={Link} to="/games">
                My Games
              </Nav.Link>
            )}
          </Nav>
          <Nav>
            <Account />
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
