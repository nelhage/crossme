import { useEffect, useRef, useState } from "react";

import Select, { SingleValue } from "react-select";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";

import { NavigateFunction, useNavigate } from "react-router";

import { PuzzleIndex } from "../pb/puzzle_pb";
import * as Pb from "../pb/crossme_pb";
import { CrossMeClient } from "../pb/CrossmeServiceClientPb";
import { useClient } from "../rpc";

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
  let resp: null | Pb.UploadPuzzleResponse = null;
  for (const file of files) {
    const buf = await readFile(file);
    resp = await new Promise((resolve, reject) => {
      const args = new Pb.UploadPuzzleArgs();
      args.setFilename(file.name);
      args.setData(buf);
      client.uploadPuzzle(args, null, (err, resp) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(resp);
      });
    });
  }
  if (!resp) {
    return;
  }
  const puz = resp.getPuzzle();
  if (!puz) {
    return;
  }
  const meta = puz.getMetadata();
  if (!meta) {
    return;
  }
  navigate(`/preview/${meta.getId()}`);
}

export const NewGameModal = ({ show, onClose }: NewGameModalProps) => {
  const [index, setIndex] = useState<PuzzleIndex[]>([]);
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
  const navigate = useNavigate();
  const puzzles: PuzzleOption[] = index.map((puz) => ({
    value: puz.getId(),
    label: puz.getTitle(),
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
    const args = new Pb.NewGameArgs();
    args.setPuzzleId(selectedId);
    client.newGame(args, null, (err, resp) => {
      if (err !== null) {
        console.log("unable to create new game: ", err);
        return;
      }
      const game = resp.getGame();
      if (game) {
        navigate(`/game/${game.getId()}`, { state: { puzzleId: selectedId } });
        onClose();
      }
    });
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
