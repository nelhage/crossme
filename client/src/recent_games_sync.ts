import { timestampFromDate } from "@bufbuild/protobuf/wkt";

import { getRecentGames } from "./recent_games";
import type { CrossMeClient } from "./rpc";

// Pushes the browser-local recent-games list into the signed-in user's
// server-side history, so games played before signing in follow the
// account. Once per user per page load is enough: the server merge is
// idempotent, and plays made *while* signed in are recorded server-side
// directly.

let syncedFor: string | null = null;
let inflight: Promise<void> = Promise.resolve();

export function ensureSynced(
  client: CrossMeClient,
  userId: string
): Promise<void> {
  if (syncedFor !== userId) {
    syncedFor = userId;
    inflight = sync(client);
  }
  return inflight;
}

async function sync(client: CrossMeClient): Promise<void> {
  const games = getRecentGames();
  if (games.length === 0) {
    return;
  }
  try {
    await client.recordPlays({
      plays: games.map((game) => ({
        gameId: game.gameId,
        playedAt: timestampFromDate(new Date(game.playedAt)),
      })),
    });
  } catch (err) {
    // History is a convenience: the local list still covers this
    // browser. Clearing the marker retries on the next ensureSynced.
    console.log("error syncing recent games: ", err);
    syncedFor = null;
  }
}

export function resetSyncForTests() {
  syncedFor = null;
  inflight = Promise.resolve();
}
