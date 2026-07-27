import { useState } from "react";

import Nav from "react-bootstrap/Nav";

import { NewGameModal } from "./new_game_modal";

export const NewGame = () => {
  const [show, setShow] = useState(false);
  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  return (
    <span>
      <Nav.Link as="button" type="button" onClick={handleShow}>
        New Game
      </Nav.Link>
      <NewGameModal show={show} onClose={handleClose} />
    </span>
  );
};
