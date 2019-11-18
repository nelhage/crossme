import React, { useEffect, useState } from "react";

import Select from "react-select";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";

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
  const puzzles = index.map(puz => {
    return {
      value: puz.getId(),
      label: puz.getTitle()
    };
  });
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
                  <Select options={puzzles} />
                </div>
              </Form.Row>
              <Form.Row className="mb-3">
                <ButtonGroup>
                  <Button
                    variant="secondary"
                    /*onClick={this.doPreview.bind(this)}*/
                  >
                    Preview
                  </Button>
                  <Button
                    variant="primary"
                    /*onClick={this.newGame.bind(this)}*/
                  >
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
