import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { create } from "@bufbuild/protobuf";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";

import {
  GetMyGamesResponseSchema,
  GetSelfResponseSchema,
} from "../pb/crossme_pb";
import { ClientContext, type CrossMeClient } from "../rpc";
import { UserProvider } from "../user_provider";
import { MyGames } from "./my_games";

function renderMyGames(client: Partial<CrossMeClient>) {
  render(
    <ClientContext.Provider value={client as CrossMeClient}>
      <UserProvider>
        <MemoryRouter>
          <MyGames />
        </MemoryRouter>
      </UserProvider>
    </ClientContext.Provider>
  );
}

const anonymousSelf = () =>
  vi.fn().mockResolvedValue(create(GetSelfResponseSchema, {}));

const signedInSelf = () =>
  vi.fn().mockResolvedValue(
    create(GetSelfResponseSchema, {
      user: { id: "user-1", displayName: "Ada" },
    })
  );

it("prompts anonymous visitors to sign in", async () => {
  const getMyGames = vi
    .fn()
    .mockResolvedValue(create(GetMyGamesResponseSchema, {}));
  renderMyGames({ getSelf: anonymousSelf(), getMyGames });

  expect(await screen.findByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/api/auth/google/login"
  );
});

it("shows an empty state for a signed-in user with no games", async () => {
  const getMyGames = vi
    .fn()
    .mockResolvedValue(create(GetMyGamesResponseSchema, {}));
  renderMyGames({ getSelf: signedInSelf(), getMyGames });

  await waitFor(() => expect(getMyGames).toHaveBeenCalled());
  expect(await screen.findByText(/haven.t played any games yet/)).toBeVisible();
});

it("lists games with title, author, and status", async () => {
  const getMyGames = vi.fn().mockResolvedValue(
    create(GetMyGamesResponseSchema, {
      games: [
        {
          gameId: "game-1",
          puzzleId: "puz-1",
          title: "Monday Puzzle",
          author: "Alice",
          lastPlayed: timestampFromDate(new Date(2026, 0, 15)),
        },
        {
          gameId: "game-2",
          puzzleId: "puz-2",
          title: "Tuesday Puzzle",
          author: "Bob",
          lastPlayed: timestampFromDate(new Date(2026, 0, 10)),
          completedAt: timestampFromDate(new Date(2026, 0, 12)),
        },
      ],
    })
  );
  renderMyGames({ getSelf: signedInSelf(), getMyGames });

  const link = await screen.findByRole("link", { name: "Monday Puzzle" });
  expect(link).toHaveAttribute("href", "/game/game-1");
  const rows = screen.getAllByRole("row").slice(1); // skip the header
  expect(rows).toHaveLength(2);
  expect(rows[0]).toHaveTextContent("Monday Puzzle");
  expect(rows[0]).toHaveTextContent("Alice");
  expect(rows[0]).toHaveTextContent("In progress");
  expect(rows[1]).toHaveTextContent("Tuesday Puzzle");
  expect(rows[1]).toHaveTextContent("Solved");
});
