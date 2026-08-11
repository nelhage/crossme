import React, { StrictMode, act } from "react";
import { render } from "@testing-library/react";

import ThePuzzle from "../puzzle";
import { ClientContext, type CrossMeClient } from "../rpc";
import { PuzzleComponent } from "./puzzle";

// A client whose subscription never yields and never ends, so the
// component under test sees only its own local edits.
function fakeClient(updateFill: CrossMeClient["updateFill"]): CrossMeClient {
  return {
    updateFill,
    subscribe: () => ({
      [Symbol.asyncIterator]: () => ({
        next: () => new Promise<never>(() => {}),
      }),
    }),
  } as unknown as CrossMeClient;
}

function renderPuzzle(updateFill: CrossMeClient["updateFill"]) {
  const ref = React.createRef<PuzzleComponent>();
  render(
    <StrictMode>
      <ClientContext.Provider value={fakeClient(updateFill)}>
        <PuzzleComponent ref={ref} puzzle={ThePuzzle} gameId="game-1" />
      </ClientContext.Provider>
    </StrictMode>
  );
  const component = ref.current;
  if (!component) {
    throw new Error("PuzzleComponent did not mount");
  }
  return component;
}

// StrictMode double-invokes state updater functions in development, so
// an updater that sends the fill to the server would send it twice.
it("sends each local edit to the server exactly once", () => {
  const updateFill = vi.fn().mockResolvedValue({});
  const puzzle = renderPuzzle(
    updateFill as unknown as CrossMeClient["updateFill"]
  );

  act(() => {
    puzzle.onInput("a");
  });

  expect(updateFill).toHaveBeenCalledTimes(1);
  expect(updateFill.mock.calls[0][0]).toMatchObject({ gameId: "game-1" });
});

it("sends nothing for an edit that doesn't change the fill", () => {
  const updateFill = vi.fn().mockResolvedValue({});
  const puzzle = renderPuzzle(
    updateFill as unknown as CrossMeClient["updateFill"]
  );

  act(() => {
    puzzle.onClickCell({ row: 0, column: 1 });
  });

  expect(updateFill).not.toHaveBeenCalled();
});
