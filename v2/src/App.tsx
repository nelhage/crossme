import React from "react";
import ThePuzzle from "./puzzle";
import "./App.css";

import { PuzzleComponent } from "./components/puzzle";

const App: React.FC = () => {
  return (
    <div className="App">
      <PuzzleComponent puzzle={ThePuzzle} />
    </div>
  );
};

export default App;
