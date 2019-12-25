import React from "react";

import { Puzzle } from "../types";

export interface MetadataProps {
  puzzle: Puzzle;
  solved: boolean;
}

export class Metadata extends React.Component<MetadataProps> {
  render() {
    return (
      <div id="details">
        <div className="title">
          <span className="badge badge-default">Title</span>{" "}
          <span className="value">{this.props.puzzle.title}</span>
          {this.props.solved && (
            <span className="badge badge-success">Solved!</span>
          )}
        </div>
        <div className="author">
          <span className="badge badge-default">By</span>{" "}
          <span className="value">{this.props.puzzle.author}</span>
        </div>
        {this.props.puzzle.note && (
          <div className="note">
            <span className="badge badge-default">Note</span>{" "}
            <span className="value">{this.props.puzzle.note}</span>
          </div>
        )}
      </div>
    );
  }
}
