import React from "react";

import { render } from "@testing-library/react";

import { PuzzleGrid } from "./puzzle_grid";

import ThePuzzle from "../puzzle";

import * as Crossword from "../crossword";
import * as Types from "../types";

function getCellAt(
  container: HTMLElement,
  row: number,
  column: number
): HTMLDivElement {
  const cell = container.querySelector(
    `div[data-row="${row}"][data-column="${column}"]`
  );
  if (!cell) {
    throw new Error(`Found no cell at (${row}, ${column})`);
  }
  return cell as HTMLDivElement;
}
function update(
  g: Crossword.Game,
  op: (g: Crossword.Game) => Crossword.GameUpdate
): Crossword.Game {
  const update = op(g);
  return Crossword.withUpdate(g, update);
}

it("renders a grid", () => {
  const onClickCell = () => null;
  const onInput = () => null;
  const game = update(Crossword.newGame(ThePuzzle), g =>
    Crossword.selectSquare(g, {
      row: 1,
      column: 2
    })
  );

  const { container, rerender } = render(
    <PuzzleGrid game={game} onClickCell={onClickCell} onInput={onInput} />
  );
  const activeCell = getCellAt(container, 1, 2);
  expect(activeCell.className).toContain("selected");

  const newGame = update(update(game, g => Crossword.swapDirection(g)), g =>
    Crossword.selectSquare(g, { row: 9, column: 9 })
  );

  rerender(
    <PuzzleGrid game={newGame} onClickCell={onClickCell} onInput={onInput} />
  );

  expect(activeCell.className).not.toContain("selected");
});
