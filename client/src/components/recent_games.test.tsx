import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { create } from "@bufbuild/protobuf";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";

import { GetMyGamesResponseSchema } from "../pb/crossme_pb";
import { UserSchema } from "../pb/user_pb";
import { RecentGames } from "./recent_games";
import { recordRecentGame } from "../recent_games";
import { resetSyncForTests } from "../recent_games_sync";
import { ClientContext, type CrossMeClient } from "../rpc";
import { UserContext } from "../user";

function renderMenu(client: Partial<CrossMeClient> = {}, userId?: string) {
  const user = userId ? create(UserSchema, { id: userId }) : null;
  render(
    <ClientContext.Provider value={client as CrossMeClient}>
      <UserContext.Provider value={{ user, clearUser: () => {} }}>
        <MemoryRouter>
          <RecentGames />
        </MemoryRouter>
      </UserContext.Provider>
    </ClientContext.Provider>
  );
  fireEvent.click(screen.getByRole("button", { name: "Recent Games" }));
}

beforeEach(() => {
  window.localStorage.clear();
  window.dispatchEvent(new StorageEvent("storage", { key: null }));
  resetSyncForTests();
});

it("lists recent games most-recent first", () => {
  vi.useFakeTimers();
  try {
    vi.setSystemTime(1000);
    recordRecentGame({
      gameId: "game-1",
      puzzleId: "puz-1",
      title: "Monday Puzzle",
      author: "Alice",
    });
    vi.setSystemTime(2000);
    recordRecentGame({
      gameId: "game-2",
      puzzleId: "puz-2",
      title: "Tuesday Puzzle",
      author: "Bob",
    });
  } finally {
    vi.useRealTimers();
  }

  renderMenu();

  const links = screen.getAllByRole("link");
  expect(links.map((l) => l.getAttribute("href"))).toEqual([
    "/game/game-2",
    "/game/game-1",
  ]);
  expect(links[0]).toHaveTextContent("Tuesday Puzzle");
  expect(links[0]).toHaveTextContent("By Bob");
});

it("says so when there are no recent games", () => {
  renderMenu();

  expect(screen.getByText("No recent games")).toBeVisible();
  expect(screen.queryAllByRole("link")).toEqual([]);
});

it("merges the account's server-side history when signed in", async () => {
  vi.useFakeTimers();
  try {
    vi.setSystemTime(2000);
    recordRecentGame({
      gameId: "game-local",
      puzzleId: "puz-1",
      title: "Local Puzzle",
      author: "Alice",
    });
  } finally {
    vi.useRealTimers();
  }

  const getMyGames = vi.fn().mockResolvedValue(
    create(GetMyGamesResponseSchema, {
      games: [
        // Played on another device, more recently than the local game.
        {
          gameId: "game-remote",
          puzzleId: "puz-2",
          title: "Remote Puzzle",
          author: "Bob",
          lastPlayed: timestampFromDate(new Date(3000)),
        },
        // The same game the local list has, with an older server-side
        // last-played: the fresher local entry should win.
        {
          gameId: "game-local",
          puzzleId: "puz-1",
          title: "Local Puzzle",
          author: "Alice",
          lastPlayed: timestampFromDate(new Date(1000)),
        },
      ],
    })
  );
  const recordPlays = vi.fn().mockResolvedValue({});
  renderMenu({ getMyGames, recordPlays }, "user-1");

  await waitFor(() => {
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual([
      "/game/game-remote",
      "/game/game-local",
    ]);
  });

  // The browser-local history was synced up before fetching.
  expect(recordPlays).toHaveBeenCalledTimes(1);
  const plays = recordPlays.mock.calls[0][0].plays;
  expect(plays).toHaveLength(1);
  expect(plays[0].gameId).toEqual("game-local");
  expect(timestampFromDate(new Date(2000))).toMatchObject({
    seconds: plays[0].playedAt.seconds,
    nanos: plays[0].playedAt.nanos,
  });
});

it("leaves the menu browser-local for anonymous users", () => {
  const getMyGames = vi.fn();
  const recordPlays = vi.fn();
  recordRecentGame({
    gameId: "game-1",
    puzzleId: "puz-1",
    title: "Monday Puzzle",
    author: "Alice",
  });

  renderMenu({ getMyGames, recordPlays });

  expect(screen.getByRole("link", { name: /Monday Puzzle/ })).toBeVisible();
  expect(getMyGames).not.toHaveBeenCalled();
  expect(recordPlays).not.toHaveBeenCalled();
});
