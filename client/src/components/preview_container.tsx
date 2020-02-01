import React, { useState, useEffect } from "react";

import * as Types from "../types";
import { PuzzleComponent } from "./puzzle";

import * as Pb from "../pb/crossme_pb";
import { useClient, proto2Puzzle } from "../rpc";

export interface PreviewContainerProps {
  puzzleId: string;
}

export const PreviewContainer: React.FC<PreviewContainerProps> = ({
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
      setPuzzle(proto2Puzzle(proto));
    });
  }, [client, puzzleId]);
  if (puzzle) {
    return <PuzzleComponent puzzle={puzzle} key={puzzleId} />;
  } else {
    return null;
  }
};
