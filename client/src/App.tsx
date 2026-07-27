import { useMemo } from "react";

import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  useLocation,
  useParams,
} from "react-router";

import { CrossMeClient } from "./pb/CrossmeServiceClientPb";

import { ClientContext } from "./rpc";
import { PreviewContainer } from "./components/preview_container";
import { GameContainer } from "./components/game_container";
import { HomePage } from "./components/home_page";
import { Header } from "./components/header";

const Layout = () => (
  <div className="App">
    <Header />
    <Outlet />
  </div>
);

const RoutePreview = () => {
  const { puzzleId } = useParams<"puzzleId">();
  return <PreviewContainer puzzleId={puzzleId ?? ""} />;
};

interface LocationState {
  puzzleId?: string;
}

const RouteGame = () => {
  const { gameId } = useParams<"gameId">();
  const state = useLocation().state as LocationState | null;
  return <GameContainer gameId={gameId ?? ""} puzzleId={state?.puzzleId} />;
};

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "preview/:puzzleId", element: <RoutePreview /> },
      { path: "game/:gameId", element: <RouteGame /> },
    ],
  },
]);

const App = () => {
  const client = useMemo(
    () => new CrossMeClient(window.location.origin + "/api", null, null),
    []
  );
  return (
    <ClientContext value={client}>
      <RouterProvider router={router} />
    </ClientContext>
  );
};

export default App;
