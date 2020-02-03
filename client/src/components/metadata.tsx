import React from "react";

import { Puzzle } from "../types";

export interface MetadataProps {
  puzzle: Puzzle;
  solved: boolean;
}

export const Metadata: React.FC<MetadataProps> = ({ puzzle, solved }) => {
  return (
    <div id="details">
      <div className="title">
        <span className="badge badge-default">Title</span>{" "}
        <span className="value">{puzzle.title}</span>
        {solved && <span className="badge badge-success">Solved!</span>}
      </div>
      <div className="author">
        <span className="badge badge-default">By</span>{" "}
        <span className="value">{puzzle.author}</span>
      </div>
      {puzzle.note && (
        <div className="note">
          <span className="badge badge-default">Note</span>{" "}
          <span className="value">{puzzle.note}</span>
        </div>
      )}
    </div>
  );
};
