import { useCallback, useEffect, useState } from "react";

import NavDropdown from "react-bootstrap/NavDropdown";

import { Link } from "react-router";

import { timestampDate } from "@bufbuild/protobuf/wkt";

import type { MyGame } from "../pb/crossme_pb";
import {
  mergeRecentGames,
  useRecentGames,
  type RecentGame,
} from "../recent_games";
import { ensureSynced } from "../recent_games_sync";
import { useClient } from "../rpc";
import { useUser } from "../user";

import "./style/recent_games.css";

function formatPlayedAt(playedAt: number): string {
  return new Date(playedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function myGame2Recent(game: MyGame): RecentGame {
  return {
    gameId: game.gameId,
    puzzleId: game.puzzleId,
    title: game.title,
    author: game.author,
    playedAt: game.lastPlayed ? timestampDate(game.lastPlayed).getTime() : 0,
  };
}

const RecentGameItem = ({ game }: { game: RecentGame }) => (
  <NavDropdown.Item as={Link} to={`/game/${game.gameId}`}>
    <div className="recent-game">
      <span className="title">{game.title || "Untitled puzzle"}</span>
      <span className="played-at">{formatPlayedAt(game.playedAt)}</span>
    </div>
    {game.author && <div className="author">By {game.author}</div>}
  </NavDropdown.Item>
);

// The menu shows the browser-local list merged with the signed-in
// account's server-side history, so games played on other devices show
// up too. The local half updates instantly when a game is opened; the
// server half is refreshed whenever the menu opens.
export const RecentGames = () => {
  const local = useRecentGames();
  const client = useClient();
  const { user } = useUser();
  const userId = user?.id;

  // Tagged with the user it was fetched for, so a stale response never
  // shows another account's games.
  const [server, setServer] = useState<null | {
    userId: string;
    games: RecentGame[];
  }>(null);

  const refresh = useCallback(() => {
    if (!userId) {
      return;
    }
    // Sync the local list up first, so games played while signed out
    // are part of the history we fetch back.
    ensureSynced(client, userId)
      .then(() => client.getMyGames({}))
      .then(
        (resp) => setServer({ userId, games: resp.games.map(myGame2Recent) }),
        (err) => {
          // The local list still has this browser's games.
          console.log("error loading recent games: ", err);
        }
      );
  }, [client, userId]);

  useEffect(() => refresh(), [refresh]);

  const games = mergeRecentGames(
    local,
    server !== null && server.userId === userId ? server.games : []
  );

  return (
    <NavDropdown
      title="Recent Games"
      id="recent-games-dropdown"
      onToggle={(open) => open && refresh()}
    >
      {games.length === 0 ? (
        <NavDropdown.ItemText className="text-muted">
          No recent games
        </NavDropdown.ItemText>
      ) : (
        games.map((game) => <RecentGameItem key={game.gameId} game={game} />)
      )}
    </NavDropdown>
  );
};
