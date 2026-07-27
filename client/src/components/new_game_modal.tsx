import { useEffect, useRef, useState } from "react";

import Select, { SingleValue } from "react-select";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";

import { NavigateFunction, useNavigate } from "react-router";

import type { PuzzleIndex } from "../pb/puzzle_pb";
import type { UploadPuzzleResponse } from "../pb/crossme_pb";
import { useClient, type CrossMeClient } from "../rpc";

export interface NewGameModalProps {
  show: boolean;
  onClose: () => void;
}

interface PuzzleOption {
  value: string;
  label: string;
}

function readFile(f: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => {
      reject(fr.error);
    };
    fr.onload = () => {
      resolve(new Uint8Array(fr.result as ArrayBuffer));
    };
    fr.readAsArrayBuffer(f);
  });
}

async function uploadFiles(
  client: CrossMeClient,
  navigate: NavigateFunction,
  files: FileList
) {
  if (files.length === 0) {
    return;
  }
  let resp: null | UploadPuzzleResponse = null;
  for (const file of files) {
    const buf = await readFile(file);
    resp = await client.uploadPuzzle({ filename: file.name, data: buf });
  }
  const meta = resp?.puzzle?.metadata;
  if (!meta) {
    return;
  }
  navigate(`/preview/${meta.id}`);
}

export const NewGameModal = ({ show, onClose }: NewGameModalProps) => {
  const [index, setIndex] = useState<PuzzleIndex[]>([]);
  const [selectedId, setSelectedId] = useState<null | string>(null);
  const client = useClient();
  useEffect(() => {
    client.getPuzzleIndex({}).then(
      (resp) => {
        setIndex(resp.puzzles);
      },
      (err) => {
        console.log("unable to load puzzle index: ", err);
      }
    );
  }, [client]);
  const navigate = useNavigate();
  const puzzles: PuzzleOption[] = index.map((puz) => ({
    value: puz.id,
    label: puz.title,
  }));
  const selectGame = (option: SingleValue<PuzzleOption>) => {
    if (option) {
      setSelectedId(option.value);
    }
  };
  const preview = () => {
    if (selectedId) {
      navigate(`/preview/${selectedId}`);
      onClose();
    }
  };
  const newGame = () => {
    if (!selectedId) {
      return;
    }
    client.newGame({ puzzleId: selectedId }).then(
      (resp) => {
        if (resp.game) {
          navigate(`/game/${resp.game.id}`, {
            state: { puzzleId: selectedId },
          });
          onClose();
        }
      },
      (err) => {
        console.log("unable to create new game: ", err);
      }
    );
  };

  const files = useRef<HTMLInputElement>(null);
  const handleUpload = () => {
    const fileList = files.current?.files;
    if (!fileList) {
      return;
    }

    uploadFiles(client, navigate, fileList).then(onClose);
  };
  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Start a new game...</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div id="selector">
          <Form>
            <div className="mb-3">
              <Select options={puzzles} onChange={selectGame} />
            </div>
            <div className="mb-3">
              <ButtonGroup>
                <Button variant="secondary" onClick={preview}>
                  Preview
                </Button>
                <Button variant="primary" onClick={newGame}>
                  New Game
                </Button>
              </ButtonGroup>
            </div>
          </Form>
        </div>

        <hr />

        <Form>
          <div className="mb-3">
            <Form.Label htmlFor="puzfile">
              Or upload new{" "}
              <a href="https://code.google.com/p/puz/wiki/FileFormat">.puz</a>:
            </Form.Label>
            <Form.Control
              id="puzfile"
              type="file"
              accept=".puz"
              ref={files}
              multiple
            />
          </div>
          <div className="mb-3">
            <Button variant="primary" onClick={handleUpload}>
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
