import React, { useState, useEffect } from "react";
import "./App.css";

import * as Types from "./types";
import { PuzzleComponent } from "./components/puzzle";

const App: React.FC = () => {
  const [puzzle, setPuzzle] = useState(null as null | Types.Puzzle);
  useEffect(() => {
    const promise = fetch("/api/puzzle");
    promise.then(resp => resp.json()).then(json => setPuzzle(json.puzzle));
  }, []);
  return (
    <div className="App">{puzzle && <PuzzleComponent puzzle={puzzle} />}</div>
  );
};

export default App;
