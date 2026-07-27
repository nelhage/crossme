import Button from "react-bootstrap/Button";

import { Puzzle } from "../types";

export interface MetadataProps {
  puzzle: Puzzle;
  solved: boolean;
  preview?: boolean;
  startGame?: () => void;
}

export const Metadata = ({
  puzzle,
  solved,
  preview,
  startGame,
}: MetadataProps) => {
  return (
    <div id="details">
      <div className="title">
        {preview ? (
          <span className="badge bg-info">Preview</span>
        ) : (
          <span className="badge bg-secondary">Title</span>
        )}{" "}
        <span className="value">{puzzle.title}</span>
        {solved && <span className="badge bg-success">Solved!</span>}
      </div>
      <div className="author">
        <span className="badge bg-secondary">By</span>{" "}
        <span className="value">{puzzle.author}</span>
      </div>
      {preview && (
        <div className="preview">
          <Button variant="secondary" onClick={startGame}>
            Start Game
          </Button>
        </div>
      )}
      {puzzle.note && (
        <div className="note">
          <span className="badge bg-secondary">Note</span>{" "}
          <span className="value">{puzzle.note}</span>
        </div>
      )}
    </div>
  );
};
