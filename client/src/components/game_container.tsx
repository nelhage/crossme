import { useState, useEffect } from "react";

import * as Types from "../types";
import { PuzzleComponent } from "./puzzle";

import { useClient, proto2Puzzle } from "../rpc";

export interface GameContainerProps {
  gameId: string;
  puzzleId?: string;
}

export const GameContainer = ({ gameId, puzzleId }: GameContainerProps) => {
  const [puzzle, setPuzzle] = useState<null | Types.Puzzle>(null);
  const client = useClient();
  useEffect(() => {
    client.getGameById({ id: gameId }).then(
      (resp) => {
        if (resp.puzzle) {
          setPuzzle(proto2Puzzle(resp.puzzle));
        }
      },
      (err) => {
        console.log("error loading game: ", err);
      }
    );
  }, [client, gameId]);
  if (puzzle) {
    return <PuzzleComponent puzzle={puzzle} gameId={gameId} key={puzzleId} />;
  } else {
    return null;
  }
};
