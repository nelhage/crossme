import React, { useState, useEffect } from "react";

import * as Types from "../types";
import { PuzzleComponent } from "./puzzle";

import * as Pb from "../pb/crossme_pb";
import { useClient, proto2Puzzle } from "../rpc";

export interface GameContainerProps {
  gameId: string;
  puzzleId?: string;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  gameId,
  puzzleId
}) => {
  const [puzzle, setPuzzle] = useState(null as null | Types.Puzzle);
  const client = useClient();
  useEffect(() => {
    const args = new Pb.GetGameByIdArgs();
    args.setId(gameId);
    client.getGameById(args, null, (err, resp) => {
      if (err !== null) {
        console.log("error loading game: ", err);
        return;
      }
      const proto = resp.getPuzzle();
      if (!proto) {
        return;
      }
      setPuzzle(proto2Puzzle(proto));
    });
  }, [client, gameId]);
  if (puzzle) {
    return <PuzzleComponent puzzle={puzzle} gameId={gameId} key={puzzleId} />;
  } else {
    return null;
  }
};
