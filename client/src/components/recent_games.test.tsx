import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { RecentGames } from "./recent_games";
import { recordRecentGame } from "../recent_games";

function renderMenu() {
  render(
    <MemoryRouter>
      <RecentGames />
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole("button", { name: "Recent Games" }));
}

beforeEach(() => {
  window.localStorage.clear();
  window.dispatchEvent(new StorageEvent("storage", { key: null }));
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
