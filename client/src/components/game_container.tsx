import { useState, useEffect } from "react";

import * as Types from "../types";
import { PuzzleComponent } from "./puzzle";

import { useClient, proto2Puzzle } from "../rpc";
import { recordRecentGame } from "../recent_games";

export interface GameContainerProps {
  gameId: string;
}

export const GameContainer = ({ gameId }: GameContainerProps) => {
  const [puzzle, setPuzzle] = useState<null | Types.Puzzle>(null);
  const client = useClient();
  useEffect(() => {
    client.getGameById({ id: gameId }).then(
      (resp) => {
        if (resp.puzzle) {
          const puzzle = proto2Puzzle(resp.puzzle);
          setPuzzle(puzzle);
          // Every route into a game lands here, so this is the one place
          // we need to remember it.
          recordRecentGame({
            gameId,
            puzzleId: puzzle.id,
            title: puzzle.title,
            author: puzzle.author,
          });
        }
      },
      (err) => {
        console.log("error loading game: ", err);
      }
    );
  }, [client, gameId]);

  if (puzzle) {
    return <PuzzleComponent puzzle={puzzle} gameId={gameId} key={puzzle.id} />;
  } else {
    return null;
  }
};
