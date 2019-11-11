import React from "react";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  useParams
} from "react-router-dom";

import "./App.css";

import { PuzzleContainer } from "./components/puzzle_container";
import { HomePage } from "./components/home_page";

const RoutePuzzle: React.FC = () => {
  const { puzzleId } = useParams<{ puzzleId: string }>();
  return <PuzzleContainer puzzleId={puzzleId} />;
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/puzzle/:puzzleId">
            <RoutePuzzle />
          </Route>

          <Route path="/">
            <HomePage />
          </Route>
        </Switch>
      </div>
    </Router>
  );
};

export default App;
