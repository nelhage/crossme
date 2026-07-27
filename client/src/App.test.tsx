import { render, screen } from "@testing-library/react";

import App from "./App";

it("renders the home page", () => {
  render(<App />);

  expect(
    screen.getByRole("heading", { name: /welcome to crossme/i })
  ).toBeVisible();
  expect(screen.getByRole("link", { name: "CrossMe" })).toBeVisible();
  expect(screen.getByRole("button", { name: "New Game" })).toBeVisible();
});
