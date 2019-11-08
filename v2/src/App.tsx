import React, { useState, useEffect } from "react";
import "./App.css";

import * as Types from "./types";
import { PuzzleComponent } from "./components/puzzle";

import * as Pb from './pb/crossme_pb';
import {CrossMeClient} from './pb/CrossmeServiceClientPb';

const App: React.FC = () => {
  const [puzzle, setPuzzle] = useState(null as null | Types.Puzzle);
    useEffect(() => {
        const client = new CrossMeClient(window.location.origin + "/api", null, null);
        const args = new Pb.GetPuzzleByIdArgs();
        client.getPuzzleById(
            args, null, (err, resp) => {
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
                    squares: proto.getSquaresList().map((sq) => {
                        const conv =  sq.toObject();
                        if (conv.number === 0) {
                            delete conv.number;
                        }
                        return conv;
                    }),
                    across_clues: proto.getAcrossCluesList().map(c => c.toObject()),
                    down_clues: proto.getDownCluesList().map(c => c.toObject()),
                }
                setPuzzle(puz);
            });
  }, []);
  return (
    <div className="App">{puzzle && <PuzzleComponent puzzle={puzzle} />}</div>
  );
};

export default App;
