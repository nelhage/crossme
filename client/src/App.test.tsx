import { render, screen } from "@testing-library/react";

import App from "./App";

it("sends the front page to the puzzle list", () => {
  render(<App />);

  expect(window.location.pathname).toBe("/puzzles");
  expect(screen.getByRole("heading", { name: "Puzzles" })).toBeVisible();
  expect(screen.getByRole("link", { name: "CrossMe" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Puzzles" })).toHaveAttribute(
    "href",
    "/puzzles"
  );
  expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
    "href",
    "/about"
  );
});
