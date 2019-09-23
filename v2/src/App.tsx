import React from "react";
import { Puzzle } from "./types";
import ThePuzzle from "./puzzle";
import "./App.css";

export const puz: Puzzle = ThePuzzle;

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
};

export default App;
