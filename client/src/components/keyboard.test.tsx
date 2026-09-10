import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { Keyboard } from "./keyboard";

function renderKeyboard(fill = "") {
  const onInput = vi.fn();
  const onDelete = vi.fn();
  const ref = React.createRef<Keyboard>();
  render(
    <Keyboard ref={ref} fill={fill} onInput={onInput} onDelete={onDelete} />
  );
  return { onInput, onDelete, ref };
}

function key(name: string): HTMLElement {
  return screen.getByRole("button", { name });
}

it("types letters and deletes on pointerdown", () => {
  const { onInput, onDelete } = renderKeyboard();

  fireEvent.pointerDown(key("Q"), { button: 0 });
  fireEvent.pointerDown(key("Backspace"), { button: 0 });

  expect(onInput).toHaveBeenCalledWith("Q");
  expect(onDelete).toHaveBeenCalledTimes(1);
});

it("ignores secondary buttons", () => {
  const { onInput } = renderKeyboard();

  fireEvent.pointerDown(key("Q"), { button: 2 });

  expect(onInput).not.toHaveBeenCalled();
});

it("commits free-text entry when the box closes", () => {
  const { onInput } = renderKeyboard();

  fireEvent.click(key("Other characters"));
  const input = screen.getByRole("textbox") as HTMLInputElement;
  expect(document.activeElement).toBe(input);
  expect(screen.queryByRole("button", { name: "Q" })).toBeNull();

  fireEvent.change(input, { target: { value: "12" } });
  fireEvent.submit(input.closest("form") as HTMLFormElement);

  expect(onInput).toHaveBeenCalledWith("12");
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(key("Q")).toBeTruthy();
});

it("pre-fills the box with the cell's fill, and doesn't re-enter it", () => {
  const { onInput, ref } = renderKeyboard("ONE");

  act(() => ref.current?.openEntry());
  const input = screen.getByRole("textbox") as HTMLInputElement;
  expect(input.value).toBe("ONE");

  fireEvent.blur(input);

  expect(onInput).not.toHaveBeenCalled();
  expect(screen.queryByRole("textbox")).toBeNull();
});

it("cancels entry on Escape", () => {
  const { onInput } = renderKeyboard("ONE");

  fireEvent.click(key("Other characters"));
  const input = screen.getByRole("textbox") as HTMLInputElement;
  fireEvent.change(input, { target: { value: "TWO" } });
  fireEvent.keyDown(input, { key: "Escape" });
  fireEvent.blur(input);

  expect(onInput).not.toHaveBeenCalled();
  expect(screen.queryByRole("textbox")).toBeNull();
});
