import React from "react";

import { render } from "@testing-library/react";

import { PuzzleGrid } from "./puzzle_grid";

import ThePuzzle from "../puzzle";

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

it("renders a grid", () => {
  const { container, rerender } = render(
    <PuzzleGrid
      puzzle={ThePuzzle}
      cursor={{
        row: 1,
        column: 2,
        direction: Types.Direction.ACROSS
      }}
      onClickCell={() => null}
    />
  );
  const activeCell = getCellAt(container, 1, 2);
  expect(activeCell.className).toContain("selected");

  rerender(
    <PuzzleGrid
      puzzle={ThePuzzle}
      cursor={{
        row: 9,
        column: 9,
        direction: Types.Direction.DOWN
      }}
      onClickCell={() => null}
    />
  );

  expect(activeCell.className).not.toContain("selected");
});
