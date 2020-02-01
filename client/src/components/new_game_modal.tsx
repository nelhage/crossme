import React, { useEffect, useState } from "react";

import Select from "react-select";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";

import { useHistory } from "react-router";

import { PuzzleIndex } from "../pb/puzzle_pb";
import * as Pb from "../pb/crossme_pb";
import { useClient } from "../rpc";

export interface NewGameModalProps {
  show: boolean;
  onClose: () => void;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({
  show,
  onClose
}) => {
  const [index, setIndex] = useState<Array<PuzzleIndex>>([]);
  const [selectedId, setSelectedId] = useState<null | string>(null);
  const client = useClient();
  useEffect(() => {
    const args = new Pb.GetPuzzleIndexArgs();
    client.getPuzzleIndex(args, null, (err, resp) => {
      if (err !== null) {
        console.log("unable to load puzzle index: ", err);
        return;
      }
      setIndex(resp.getPuzzlesList());
    });
  }, [client]);
  const history = useHistory();
  const puzzles = index.map(puz => {
    return {
      value: puz.getId(),
      label: puz.getTitle()
    };
  });
  const selectGame = (value: any) => {
    if (value && value.value) {
      setSelectedId(value.value);
    }
  };
  const preview = () => {
    if (selectedId) {
      history.push(`/preview/${selectedId}`);
      onClose();
    }
  };
  const newGame = () => {
    if (!selectedId) {
      return;
    }
    const args = new Pb.NewGameArgs();
    args.setPuzzleId(selectedId);
    client.newGame(args, null, (err, resp) => {
      if (err !== null) {
        console.log("unable to create new game: ", err);
        return;
      }
      const game = resp.getGame();
      if (game) {
        history.push(`/game/${game.getId()}`, { puzzleId: selectedId });
        onClose();
      }
    });
  };
  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header>
        <Modal.Title>Start a new game...</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div id="selector">
          <Form>
            <Form.Group>
              <Form.Row className="mb-3">
                <div style={{ width: "100%" }}>
                  <Select options={puzzles} onChange={selectGame} />
                </div>
              </Form.Row>
              <Form.Row className="mb-3">
                <ButtonGroup>
                  <Button variant="secondary" onClick={preview}>
                    Preview
                  </Button>
                  <Button variant="primary" onClick={newGame}>
                    New Game
                  </Button>
                </ButtonGroup>
              </Form.Row>
            </Form.Group>
          </Form>
        </div>

        <hr />

        <Form>
          <div>
            Or upload new{" "}
            <a href="https://code.google.com/p/puz/wiki/FileFormat">.puz</a>:
            <input
              id="puzfile"
              type="file"
              className="mx-3"
              /*ref={(c) => { this.puzzleFiles = c; }}*/ multiple
            />
            <Button
              variant="primary" /*onClick={this.handleUpload.bind(this)}*/
            >
              Upload
            </Button>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};
