import { useEffect, useState } from "react";

import Table from "react-bootstrap/Table";
import { Link } from "react-router";

import { timestampDate } from "@bufbuild/protobuf/wkt";

import type { MyGame } from "../pb/crossme_pb";
import { ensureSynced } from "../recent_games_sync";
import { useClient } from "../rpc";
import { useUser } from "../user";

function formatPlayed(game: MyGame): string {
  if (!game.lastPlayed) {
    return "";
  }
  return timestampDate(game.lastPlayed).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const MyGameRow = ({ game }: { game: MyGame }) => (
  <tr>
    <td>
      <Link to={`/game/${game.gameId}`}>{game.title || "Untitled puzzle"}</Link>
    </td>
    <td>{game.author}</td>
    <td>{formatPlayed(game)}</td>
    <td>{game.completedAt ? "Solved" : "In progress"}</td>
  </tr>
);

// The signed-in user's play history, as recorded by the server. This is
// distinct from the "Recent Games" menu, which is purely browser-local:
// this list follows the account across browsers, and has no length cap.
export const MyGames = () => {
  const client = useClient();
  const { user } = useUser();
  // The result is tagged with the user it was fetched for, so a stale
  // response never renders as the current user's history.
  const [result, setResult] = useState<null | {
    userId: string | undefined;
    games?: MyGame[];
    error?: boolean;
  }>(null);

  // Refetch on sign-in/sign-out: the same RPC answers differently
  // depending on the session.
  const userId = user?.id;
  useEffect(() => {
    let cancelled = false;
    // Fold this browser's pre-sign-in games into the account before
    // fetching, so they show up on a first visit.
    const synced = userId ? ensureSynced(client, userId) : Promise.resolve();
    synced
      .then(() => client.getMyGames({}))
      .then(
        (resp) => {
          if (!cancelled) {
            setResult({ userId, games: resp.games });
          }
        },
        (err) => {
          console.log("error loading games: ", err);
          if (!cancelled) {
            setResult({ userId, error: true });
          }
        }
      );
    return () => {
      cancelled = true;
    };
  }, [client, userId]);

  const current = result !== null && result.userId === userId ? result : null;
  const games = current?.games ?? null;
  return (
    <div className="container">
      <h2>My games</h2>
      {current?.error ? (
        <p>Something went wrong loading your games. Try reloading?</p>
      ) : games === null ? (
        <p>Loading…</p>
      ) : !user && games.length === 0 ? (
        <p>
          <a href="/api/auth/google/login">Sign in</a> to keep track of the
          games you play across browsers and devices.
        </p>
      ) : games.length === 0 ? (
        <p>
          You haven&apos;t played any games yet. Click &quot;New Game&quot;
          above to get started!
        </p>
      ) : (
        <Table hover>
          <thead>
            <tr>
              <th>Puzzle</th>
              <th>Author</th>
              <th>Last played</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <MyGameRow key={game.gameId} game={game} />
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};
