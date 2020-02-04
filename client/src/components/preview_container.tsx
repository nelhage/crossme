import React, { useState, useEffect } from "react";

import { useHistory } from "react-router";

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
  const history = useHistory();

  const startGame = () => {
    if (!puzzle) {
      return;
    }
    const args = new Pb.NewGameArgs();
    args.setPuzzleId(puzzle.id);
    client.newGame(args, null, (err, resp) => {
      if (err !== null) {
        console.log("unable to create new game: ", err);
        return;
      }
      const game = resp.getGame();
      if (game) {
        history.push(`/game/${game.getId()}`, {
          puzzleId: puzzle.id
        });
      }
    });
  };

  if (puzzle) {
    return (
      <PuzzleComponent puzzle={puzzle} key={puzzleId} startGame={startGame} />
    );
  } else {
    return null;
  }
};
