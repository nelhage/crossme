import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { create } from "@bufbuild/protobuf";

import {
  GetPuzzleIndexResponseSchema,
  NewGameResponseSchema,
} from "../pb/crossme_pb";
import { PuzzleIndexSchema } from "../pb/puzzle_pb";
import { ClientContext, type CrossMeClient } from "../rpc";
import { groupByMonth, matchesQuery } from "../puzzle_index";
import { Puzzles } from "./puzzles";

const puzzle = (id: string, title: string, author: string, date: string) =>
  create(PuzzleIndexSchema, { id, title, author, date });

// Newest first, as the server orders them, with an undated straggler.
const index = [
  puzzle("p3", "Thursday Themeless", "Carol", "2026-09-03"),
  puzzle("p2", "Labor Day Special", "Bob", "2026-09-01"),
  puzzle("p1", "Summer Fun", "Alice", "2026-08-16"),
  puzzle("p0", "Mystery Grid", "  by Dan / Edited by Eve  ", ""),
];

function renderPuzzles(client: Partial<CrossMeClient>) {
  render(
    <ClientContext.Provider value={client as CrossMeClient}>
      <MemoryRouter initialEntries={["/puzzles"]}>
        <Routes>
          <Route path="/puzzles" element={<Puzzles />} />
          <Route path="/game/:gameId" element={<div>game page</div>} />
        </Routes>
      </MemoryRouter>
    </ClientContext.Provider>
  );
}

const indexClient = () => ({
  getPuzzleIndex: vi
    .fn()
    .mockResolvedValue(
      create(GetPuzzleIndexResponseSchema, { puzzles: index })
    ),
});

describe("groupByMonth", () => {
  it("buckets puzzles by month, newest first, undated last", () => {
    const groups = groupByMonth(index);
    expect(groups.map((g) => g.month)).toEqual(["2026-09", "2026-08", ""]);
    expect(groups[0].puzzles.map((p) => p.id)).toEqual(["p3", "p2"]);
    expect(groups[2].label).toBe("Undated");
  });
});

describe("matchesQuery", () => {
  const puz = puzzle("x", "Thursday Themeless", "Carol", "2026-09-03");
  it("matches every word against title, author, and date", () => {
    expect(matchesQuery(puz, "")).toBe(true);
    expect(matchesQuery(puz, "THEMELESS")).toBe(true);
    expect(matchesQuery(puz, "carol themeless")).toBe(true);
    expect(matchesQuery(puz, "2026-09")).toBe(true);
    expect(matchesQuery(puz, "carol bob")).toBe(false);
    expect(matchesQuery(puz, "friday")).toBe(false);
  });
});

it("lists puzzles under month headers", async () => {
  renderPuzzles(indexClient());

  expect(
    await screen.findByRole("link", { name: "Thursday Themeless" })
  ).toHaveAttribute("href", "/preview/p3");

  const headers = screen.getAllByRole("heading", { level: 3 });
  expect(headers.map((h) => h.textContent)).toEqual([
    "September 2026",
    "August 2026",
    "Undated",
  ]);
  expect(screen.getByText("by Carol")).toBeVisible();
  // An author field that already says "by" isn't doubled up.
  expect(screen.getByText("by Dan / Edited by Eve")).toBeVisible();
  expect(screen.getByRole("link", { name: "Mystery Grid" })).toBeVisible();
});

it("narrows the list as you search", async () => {
  renderPuzzles(indexClient());
  await screen.findByRole("link", { name: "Thursday Themeless" });

  const search = screen.getByRole("searchbox", { name: "Search puzzles" });
  fireEvent.change(search, { target: { value: "alice" } });

  expect(screen.getByRole("link", { name: "Summer Fun" })).toBeVisible();
  expect(screen.queryByRole("link", { name: "Thursday Themeless" })).toBeNull();
  // Only the months with a match keep their header.
  const headers = screen.getAllByRole("heading", { level: 3 });
  expect(headers.map((h) => h.textContent)).toEqual(["August 2026"]);

  fireEvent.change(search, { target: { value: "nothing like this" } });
  expect(screen.getByText(/No puzzles match/)).toBeVisible();
  expect(screen.queryByRole("heading", { level: 3 })).toBeNull();

  fireEvent.change(search, { target: { value: "" } });
  expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
});

it("starts a new game from a row", async () => {
  const newGame = vi.fn().mockResolvedValue(
    create(NewGameResponseSchema, {
      game: { id: "game-9", puzzleId: "p2" },
    })
  );
  renderPuzzles({ ...indexClient(), newGame });

  const row = (
    await screen.findByRole("link", { name: "Labor Day Special" })
  ).closest("li")!;
  fireEvent.click(within(row).getByRole("button", { name: /^Solve/ }));

  expect(newGame).toHaveBeenCalledWith({ puzzleId: "p2" });
  expect(await screen.findByText("game page")).toBeVisible();
});

it("explains an empty server", async () => {
  renderPuzzles({
    getPuzzleIndex: vi
      .fn()
      .mockResolvedValue(create(GetPuzzleIndexResponseSchema, {})),
  });
  expect(await screen.findByText(/no puzzles yet/)).toBeVisible();
});
