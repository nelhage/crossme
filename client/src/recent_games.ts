import { useSyncExternalStore } from "react";

// The games this browser has opened, kept in localStorage so the list
// works without an account. For signed-in users this is only half the
// story: the server keeps a per-account history too, and the two are
// merged for display (mergeRecentGames) and synced upward on sign-in
// (recent_games_sync.ts).

const STORAGE_KEY = "crossme.recent-games";

// How many games we remember. Older entries are dropped.
export const MAX_RECENT_GAMES = 10;

export interface RecentGame {
  gameId: string;
  puzzleId: string;
  title: string;
  author: string;
  // Epoch milliseconds when this game was last opened.
  playedAt: number;
}

function isRecentGame(value: unknown): value is RecentGame {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const game = value as Record<string, unknown>;
  return (
    typeof game.gameId === "string" &&
    game.gameId !== "" &&
    typeof game.puzzleId === "string" &&
    typeof game.title === "string" &&
    typeof game.author === "string" &&
    typeof game.playedAt === "number" &&
    Number.isFinite(game.playedAt)
  );
}

// Sorted most-recent first. Entries written by an older (or corrupt)
// version of the app are dropped rather than crashing the header.
function readStorage(): RecentGame[] {
  let parsed: unknown;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    parsed = JSON.parse(raw);
  } catch {
    // Storage can be unavailable entirely (private browsing, disabled
    // cookies), or hold something that isn't valid JSON. Recent games
    // are a convenience; just do without.
    return [];
  }
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed
    .filter(isRecentGame)
    .sort((a, b) => b.playedAt - a.playedAt)
    .slice(0, MAX_RECENT_GAMES);
}

function writeStorage(games: RecentGame[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch {
    // See readStorage.
  }
}

// `useSyncExternalStore` requires a stable snapshot, so we cache the
// parsed list and invalidate it whenever the underlying storage changes.
let cache: null | RecentGame[] = null;
const listeners = new Set<() => void>();

function invalidate() {
  cache = null;
  for (const listener of listeners) {
    listener();
  }
}

// `storage` fires for writes made by *other* tabs, which lets every open
// tab share one list.
window.addEventListener("storage", (ev) => {
  if (ev.key === null || ev.key === STORAGE_KEY) {
    invalidate();
  }
});

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRecentGames(): RecentGame[] {
  if (cache === null) {
    cache = readStorage();
  }
  return cache;
}

export function recordRecentGame(game: Omit<RecentGame, "playedAt">) {
  const entry: RecentGame = { ...game, playedAt: Date.now() };
  const games = [
    entry,
    ...getRecentGames().filter((g) => g.gameId !== entry.gameId),
  ].slice(0, MAX_RECENT_GAMES);
  writeStorage(games);
  invalidate();
}

export function useRecentGames(): RecentGame[] {
  return useSyncExternalStore(subscribe, getRecentGames);
}

// Merges recent-game lists — in practice the browser-local list and the
// signed-in account's server-side history — deduplicating by game and
// keeping each game's most recent play. Most recently played first,
// capped like the local list.
export function mergeRecentGames(...lists: RecentGame[][]): RecentGame[] {
  const byId = new Map<string, RecentGame>();
  for (const list of lists) {
    for (const game of list) {
      const seen = byId.get(game.gameId);
      if (!seen || game.playedAt > seen.playedAt) {
        byId.set(game.gameId, game);
      }
    }
  }
  return [...byId.values()]
    .sort((a, b) => b.playedAt - a.playedAt)
    .slice(0, MAX_RECENT_GAMES);
}
