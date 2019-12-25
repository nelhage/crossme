import React, { useState, useEffect } from "react";

import * as Types from "../types";
import { PuzzleComponent } from "./puzzle";

import * as Pb from "../pb/crossme_pb";
import { useClient } from "../rpc";

export interface PuzzleContainerProps {
  puzzleId: string;
}

export const PuzzleContainer: React.FC<PuzzleContainerProps> = ({
  puzzleId
}) => {
  const [puzzle, setPuzzle] = useState(null as null | Types.Puzzle);
  const client = useClient();
  useEffect(() => {
    const args = new Pb.GetPuzzleByIdArgs();
    args.setId(puzzleId);
    client.getPuzzleById(args, null, (err, resp) => {
      if (err !== null) {
        console.log("error loading puzzle: ", err);
        return;
      }
      const proto = resp.getPuzzle();
      if (!proto) {
        return;
      }
      const puz: Types.Puzzle = {
        title: proto.getTitle(),
        author: proto.getAuthor(),
        copyright: proto.getCopyright(),
        note: proto.getNote(),
        width: proto.getWidth(),
        height: proto.getHeight(),
        squares: proto.getSquaresList().map(sq => {
          const conv = sq.toObject();
          if (conv.number === 0) {
            delete conv.number;
          }
          return conv;
        }),
        across_clues: proto.getAcrossCluesList().map(c => c.toObject()),
        down_clues: proto.getDownCluesList().map(c => c.toObject())
      };
      setPuzzle(puz);
    });
  }, [client, puzzleId]);
  if (puzzle) {
    return <PuzzleComponent puzzle={puzzle} key={puzzleId} />;
  } else {
    return null;
  }
};
