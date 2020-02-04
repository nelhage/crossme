import React from "react";

import Button from "react-bootstrap/Button";

import { Puzzle } from "../types";

export interface MetadataProps {
  puzzle: Puzzle;
  solved: boolean;
  preview?: boolean;
  startGame?: () => void;
}

export const Metadata: React.FC<MetadataProps> = ({
  puzzle,
  solved,
  preview,
  startGame
}) => {
  return (
    <div id="details">
      <div className="title">
        {preview ? (
          <span className="badge badge-info">Preview</span>
        ) : (
          <span className="badge badge-default">Title</span>
        )}{" "}
        <span className="value">{puzzle.title}</span>
        {solved && <span className="badge badge-success">Solved!</span>}
      </div>
      <div className="author">
        <span className="badge badge-default">By</span>{" "}
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
          <span className="badge badge-default">Note</span>{" "}
          <span className="value">{puzzle.note}</span>
        </div>
      )}
    </div>
  );
};
