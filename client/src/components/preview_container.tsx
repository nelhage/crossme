import { useState, useEffect } from "react";

import { useNavigate } from "react-router";

import * as Types from "../types";
import { PuzzleComponent } from "./puzzle";

import { useClient, proto2Puzzle } from "../rpc";

export interface PreviewContainerProps {
  puzzleId: string;
}

export const PreviewContainer = ({ puzzleId }: PreviewContainerProps) => {
  const [puzzle, setPuzzle] = useState<null | Types.Puzzle>(null);
  const client = useClient();
  useEffect(() => {
    client.getPuzzleById({ id: puzzleId }).then(
      (resp) => {
        if (resp.puzzle) {
          setPuzzle(proto2Puzzle(resp.puzzle));
        }
      },
      (err) => {
        console.log("error loading puzzle: ", err);
      }
    );
  }, [client, puzzleId]);
  const navigate = useNavigate();

  const startGame = () => {
    if (!puzzle) {
      return;
    }
    client.newGame({ puzzleId: puzzle.id }).then(
      (resp) => {
        if (resp.game) {
          navigate(`/game/${resp.game.id}`, { state: { puzzleId: puzzle.id } });
        }
      },
      (err) => {
        console.log("unable to create new game: ", err);
      }
    );
  };

  if (puzzle) {
    return (
      <PuzzleComponent puzzle={puzzle} key={puzzleId} startGame={startGame} />
    );
  } else {
    return null;
  }
};
