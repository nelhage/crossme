import { render } from "@testing-library/react";
import { create } from "@bufbuild/protobuf";

import { PuzzleGrid } from "./puzzle_grid";
import { PuzzleCell } from "./puzzle_cell";
import ThePuzzle from "../puzzle";
import * as Crossword from "../crossword";
import { FillSchema, Fill_CellSchema, type Fill as FillProto } from "../pb/fill_pb";

// Render-count benchmark: simulates the live subscription path from
// PuzzleComponent -- a collaborator's single-cell deltas arrive and are
// applied via withUpdate, and the grid re-renders. PuzzleCell is a
// PureComponent whose only unstable object prop is `fill`, so the
// number of cell re-renders per update is determined by how many
// FillState objects change identity across the update.

const REMOTE_NODES = ["p1", "p2"];
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const gridProps = {
  showCursor: true,
  onClickCell: () => undefined,
  onInput: () => undefined,
};

// A mid-game state: two collaborators have correctly filled ~60% of the
// grid, delivered as the initial snapshot on subscribe.
function seededGame(): Crossword.Game {
  const g = Crossword.newGame(ThePuzzle);
  const cells: ReturnType<typeof create<typeof Fill_CellSchema>>[] = [];
  ThePuzzle.squares.forEach((sq, i) => {
    if (!sq.black && i % 5 < 3) {
      cells.push(
        create(Fill_CellSchema, {
          index: i,
          clock: BigInt(1),
          owner: i % REMOTE_NODES.length,
          fill: sq.fill,
        })
      );
    }
  });
  const snapshot = create(FillSchema, {
    clock: BigInt(1),
    nodes: [...REMOTE_NODES],
    cells,
  });
  return Crossword.withUpdate(g, { fill: snapshot });
}

function remoteDelta(index: number, clock: number, fill: string): FillProto {
  return create(FillSchema, {
    clock: BigInt(clock),
    nodes: ["p2"],
    cells: [{ index, clock: BigInt(clock), owner: 0, fill }],
  });
}

// White squares still empty after seeding, away from the cursor's row-0
// across word and column-0 down word so `inword` props stay stable.
function emptyTargets(g: Crossword.Game): number[] {
  const out: number[] = [];
  ThePuzzle.squares.forEach((sq, i) => {
    const row = Math.floor(i / ThePuzzle.width);
    const column = i % ThePuzzle.width;
    if (
      !sq.black &&
      row > 0 &&
      column > 0 &&
      !Crossword.fillAt(g, { row, column })
    ) {
      out.push(i);
    }
  });
  return out;
}

// How many entries of the view-model changed object identity -- each of
// these defeats PuzzleCell's shallow prop compare.
function identityChurn(a: Crossword.Game, b: Crossword.Game): number {
  let n = 0;
  const size = Math.max(a.fill.size, b.fill.size);
  for (let i = 0; i < size; i++) {
    if (a.fill.get(i) !== b.fill.get(i)) {
      n++;
    }
  }
  return n;
}

const whiteCells = ThePuzzle.squares.filter((sq) => !sq.black).length;

it("re-renders after a single-cell remote update", () => {
  const g0 = seededGame();
  const { container, rerender } = render(
    <PuzzleGrid game={g0} {...gridProps} />
  );

  const target = emptyTargets(g0)[40];
  const g1 = Crossword.withUpdate(g0, { fill: remoteDelta(target, 100, "Q") });

  const spy = vi.spyOn(PuzzleCell.prototype, "render");
  rerender(<PuzzleGrid game={g1} {...gridProps} />);
  const renders = spy.mock.calls.length;
  spy.mockRestore();

  const cell = container.querySelector(
    `div[data-row="${Math.floor(target / ThePuzzle.width)}"]` +
      `[data-column="${target % ThePuzzle.width}"]`
  );
  expect(cell?.textContent).toContain("Q");
  expect(renders).toBeGreaterThanOrEqual(1);

  console.log(
    `single remote cell: ${renders}/${whiteCells} white cells re-rendered ` +
      `(FillState identity churn: ${identityChurn(g0, g1)}, ` +
      `cells semantically changed: 1)`
  );
});

it("re-renders after a local keystroke", () => {
  const g0 = seededGame();
  const { rerender } = render(<PuzzleGrid game={g0} {...gridProps} />);

  const g1 = Crossword.withUpdate(g0, Crossword.keypress(g0, "A"));

  const spy = vi.spyOn(PuzzleCell.prototype, "render");
  rerender(<PuzzleGrid game={g1} {...gridProps} />);
  const renders = spy.mock.calls.length;
  spy.mockRestore();

  console.log(
    `local keystroke: ${renders}/${whiteCells} white cells re-rendered ` +
      `(FillState identity churn: ${identityChurn(g0, g1)})`
  );
});

it("applies a burst of remote updates", () => {
  let g = seededGame();
  const { rerender } = render(<PuzzleGrid game={g} {...gridProps} />);
  const targets = emptyTargets(g);

  const spy = vi.spyOn(PuzzleCell.prototype, "render");
  const N = 100;
  const start = performance.now();
  for (let i = 0; i < N; i++) {
    const target = targets[i % targets.length];
    g = Crossword.withUpdate(g, {
      fill: remoteDelta(target, 100 + i, LETTERS[i % LETTERS.length]),
    });
    rerender(<PuzzleGrid game={g} {...gridProps} />);
  }
  const ms = performance.now() - start;
  const renders = spy.mock.calls.length;
  spy.mockRestore();

  console.log(
    `${N} remote single-cell updates: ${ms.toFixed(0)}ms total, ` +
      `${(renders / N).toFixed(1)} cell re-renders/update`
  );
});
