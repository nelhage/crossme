import React from "react";

import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";

export interface NewGameModalProps {
  show: boolean;
  onClose: () => void;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({
  show,
  onClose
}) => {
  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header>
        <Modal.Title>Start a new game...</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div id="selector">
          <Form inline={true}>
            <Form.Label className="mr-3" htmlFor="switchpuzzle">
              Puzzle:
            </Form.Label>
            <Form.Group controlId="switchpuzzle">
              <Form.Row className="mb-3">
                <select className="mx-3">
                  <option>puzzle 1</option>
                </select>
                <ButtonGroup>
                  <Button
                    variant="secondary"
                    className="ml-3" /*onClick={this.doPreview.bind(this)}*/
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
