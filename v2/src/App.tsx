import React from "react";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  useParams
} from "react-router-dom";

import "./App.css";

import { CrossMeClient } from "./pb/CrossmeServiceClientPb";

import { ClientContext } from "./rpc";
import { PuzzleContainer } from "./components/puzzle_container";
import { HomePage } from "./components/home_page";
import { Header } from "./components/header";

const RoutePuzzle: React.FC = () => {
  const { puzzleId } = useParams<{ puzzleId: string }>();
  return <PuzzleContainer puzzleId={puzzleId} />;
};

const App: React.FC = () => {
  const client = React.useMemo(
    () => new CrossMeClient(window.location.origin + "/api", null, null),
    []
  );

  return (
    <ClientContext.Provider value={client}>
      <Router>
        <div className="App">
          <Header />
          <Switch>
            <Route exact path="/">
              <HomePage />
            </Route>

            <Route path="/puzzle/:puzzleId">
              <RoutePuzzle />
            </Route>
          </Switch>
        </div>
      </Router>
    </ClientContext.Provider>
  );
};

export default App;
