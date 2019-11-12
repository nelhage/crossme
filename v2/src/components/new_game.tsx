import React, { useState } from "react";

import Nav from "react-bootstrap/Nav";

import { NewGameModal } from "./new_game_modal";

export const NewGame: React.FC = () => {
  const [show, setShow] = useState(false);
  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  return (
    <span>
      <Nav.Link href="#" onClick={handleShow}>
        New Game
      </Nav.Link>
      <NewGameModal show={show} onClose={handleClose} />
    </span>
  );
};
