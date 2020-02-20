import React, { useMemo, useState } from "react";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  useParams,
  useLocation
} from "react-router-dom";

import "./App.css";

import { CrossMeClient } from "./pb/CrossmeServiceClientPb";

import { ClientContext } from "./rpc";
import { CurrentUser, Session } from "./user";
import { PreviewContainer } from "./components/preview_container";
import { GameContainer } from "./components/game_container";
import { HomePage } from "./components/home_page";
import { Header } from "./components/header";

const RoutePreview: React.FC = () => {
  const { puzzleId } = useParams<{ puzzleId: string }>();
  return <PreviewContainer puzzleId={puzzleId} />;
};

const RouteGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const loc = useLocation();
  const state = loc.state;
  return <GameContainer gameId={gameId} puzzleId={state && state.puzzleId} />;
};

const App: React.FC = () => {
  const client = useMemo(
    () => new CrossMeClient(window.location.origin + "/api", null, null),
    []
  );
  const [user, setUser] = useState<null | Session>(null);

  return (
    <ClientContext.Provider value={client}>
      <CurrentUser.Provider value={user}>
        <Router>
          <div className="App">
            <Header setUser={setUser} />
            <Switch>
              <Route exact path="/">
                <HomePage />
              </Route>

              <Route path="/preview/:puzzleId">
                <RoutePreview />
              </Route>

              <Route path="/game/:gameId">
                <RouteGame />
              </Route>
            </Switch>
          </div>
        </Router>
      </CurrentUser.Provider>
    </ClientContext.Provider>
  );
};

export default App;
