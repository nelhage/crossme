import { useMemo } from "react";

import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  useParams,
} from "react-router";

import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";

import { CrossMe } from "./pb/crossme_pb";

import { ClientContext } from "./rpc";
import { UserProvider } from "./user_provider";
import { PreviewContainer } from "./components/preview_container";
import { GameContainer } from "./components/game_container";
import { HomePage } from "./components/home_page";
import { MyGames } from "./components/my_games";
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

const RouteGame = () => {
  const { gameId } = useParams<"gameId">();
  return <GameContainer gameId={gameId ?? ""} />;
};

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "games", element: <MyGames /> },
      { path: "preview/:puzzleId", element: <RoutePreview /> },
      { path: "game/:gameId", element: <RouteGame /> },
    ],
  },
]);

const App = () => {
  const client = useMemo(
    () =>
      createClient(
        CrossMe,
        createConnectTransport({ baseUrl: window.location.origin + "/api" })
      ),
    []
  );
  return (
    <ClientContext value={client}>
      <UserProvider>
        <RouterProvider router={router} />
      </UserProvider>
    </ClientContext>
  );
};

export default App;
