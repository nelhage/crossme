import {
  MAX_RECENT_GAMES,
  getRecentGames,
  mergeRecentGames,
  recordRecentGame,
  type RecentGame,
} from "./recent_games";

const STORAGE_KEY = "crossme.recent-games";

// The store memoizes its parsed snapshot; a `storage` event is how it
// learns that localStorage changed underneath it, so this stands in for
// both a page reload and a write from another tab.
function reloadFromStorage() {
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

function record(gameId: string, at: number) {
  vi.setSystemTime(at);
  recordRecentGame({
    gameId,
    puzzleId: `puzzle-${gameId}`,
    title: `Puzzle ${gameId}`,
    author: "Anonymous",
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
  reloadFromStorage();
});

afterEach(() => {
  vi.useRealTimers();
});

it("returns games most-recent first", () => {
  record("a", 1000);
  record("b", 3000);
  record("c", 2000);

  expect(getRecentGames().map((g) => g.gameId)).toEqual(["b", "c", "a"]);
});

it("records the metadata needed to render the menu", () => {
  record("a", 1000);

  expect(getRecentGames()).toEqual([
    {
      gameId: "a",
      puzzleId: "puzzle-a",
      title: "Puzzle a",
      author: "Anonymous",
      playedAt: 1000,
    },
  ]);
});

it("moves a re-opened game to the front without duplicating it", () => {
  record("a", 1000);
  record("b", 2000);
  record("a", 3000);

  const games = getRecentGames();
  expect(games.map((g) => g.gameId)).toEqual(["a", "b"]);
  expect(games[0].playedAt).toEqual(3000);
});

it("remembers a fixed number of games", () => {
  for (let i = 0; i < MAX_RECENT_GAMES + 5; i++) {
    record(`game-${i}`, 1000 * (i + 1));
  }

  const games = getRecentGames();
  expect(games).toHaveLength(MAX_RECENT_GAMES);
  expect(games[0].gameId).toEqual(`game-${MAX_RECENT_GAMES + 4}`);
  expect(games[games.length - 1].gameId).toEqual("game-5");
});

it("persists across reloads", () => {
  record("a", 1000);
  record("b", 2000);
  reloadFromStorage();

  expect(getRecentGames().map((g) => g.gameId)).toEqual(["b", "a"]);
});

function game(gameId: string, playedAt: number): RecentGame {
  return {
    gameId,
    puzzleId: `puzzle-${gameId}`,
    title: `Puzzle ${gameId}`,
    author: "Anonymous",
    playedAt,
  };
}

it("merges lists by recency, deduplicating by game", () => {
  const merged = mergeRecentGames(
    [game("a", 3000), game("b", 1000)],
    [game("b", 2000), game("c", 2500)]
  );
  expect(merged.map((g) => g.gameId)).toEqual(["a", "c", "b"]);
  // The fresher of the two "b" entries survives.
  expect(merged[2].playedAt).toEqual(2000);
});

it("caps the merged list", () => {
  const local = [];
  const server = [];
  for (let i = 0; i < MAX_RECENT_GAMES; i++) {
    local.push(game(`local-${i}`, 10000 + i));
    server.push(game(`server-${i}`, 20000 + i));
  }
  const merged = mergeRecentGames(local, server);
  expect(merged).toHaveLength(MAX_RECENT_GAMES);
  // All the server games out-recent all the local ones.
  expect(merged.every((g) => g.gameId.startsWith("server-"))).toBe(true);
});

it("ignores junk in storage", () => {
  window.localStorage.setItem(STORAGE_KEY, "not json at all");
  reloadFromStorage();
  expect(getRecentGames()).toEqual([]);

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([{ gameId: "a", playedAt: 1 }, "nope"])
  );
  reloadFromStorage();
  expect(getRecentGames()).toEqual([]);
});
