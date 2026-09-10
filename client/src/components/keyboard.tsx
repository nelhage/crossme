import React from "react";

const ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

export interface KeyboardProps {
  // The current fill of the selected cell; pre-fills the free-text box.
  fill: string;

  onInput: (text: string) => void;
  onDelete: () => void;
}

interface KeyboardState {
  // The free-text box is open in place of the letter keys.
  entry: boolean;
}

// An on-screen keyboard for touch devices (shown by CSS only on small
// screens). It's letters-only, which is much shorter than a device
// keyboard; anything else -- a rebus, digits, punctuation -- goes
// through the "..." key, which opens a text box and so brings up the
// device keyboard for just that one entry.
//
// Keys act on pointerdown rather than click, so they feel as immediate
// as a real keyboard; the keyboard is `touch-action: none`, so a touch
// that starts on it can't be the start of a scroll. The "..." key is
// the exception: it acts on click, because iOS will only bring up the
// device keyboard for a focus() made from a click-like gesture.
export class Keyboard extends React.Component<KeyboardProps, KeyboardState> {
  root: React.RefObject<HTMLDivElement | null>;
  entryInput: React.RefObject<HTMLInputElement | null>;
  // Set by Escape: the box closes without committing its contents.
  cancelled: boolean = false;

  constructor(props: KeyboardProps) {
    super(props);
    this.state = { entry: false };
    this.root = React.createRef();
    this.entryInput = React.createRef();

    this.onKey = this.onKey.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onEntryBlur = this.onEntryBlur.bind(this);
    this.onEntryKeyDown = this.onEntryKeyDown.bind(this);
    this.openEntry = this.openEntry.bind(this);
  }

  // Whether the keyboard is currently displayed, i.e. whether CSS has
  // decided this is a touch-sized screen. Callers use this to route
  // free-text entry here rather than to an in-grid input, so that the
  // breakpoint lives in one place (the stylesheet).
  isVisible(): boolean {
    const el = this.root.current;
    return !!el && el.getClientRects().length > 0;
  }

  openEntry() {
    this.cancelled = false;
    this.setState({ entry: true });
  }

  onKey(e: React.PointerEvent<HTMLButtonElement>) {
    // Only the main button: a right-click on desktop shouldn't type.
    if (e.button !== 0) {
      return;
    }
    const key = e.currentTarget.dataset.key;
    if (key === undefined) {
      return;
    }
    if (key === "delete") {
      this.props.onDelete();
    } else {
      this.props.onInput(key);
    }
  }

  onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Committing happens on blur, so that tapping anywhere else (or
    // the device keyboard's own Done key) also commits.
    this.entryInput.current?.blur();
  }

  onEntryKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      this.cancelled = true;
      e.currentTarget.blur();
    }
  }

  onEntryBlur(e: React.FocusEvent<HTMLInputElement>) {
    const value = e.target.value.toUpperCase();
    const cancelled = this.cancelled;
    this.cancelled = false;
    this.setState({ entry: false });
    // Closing the box with its contents untouched is a cancel, not a
    // (cursor-advancing) re-entry of the same fill.
    if (!cancelled && value !== this.props.fill) {
      this.props.onInput(value);
    }
  }

  renderEntry() {
    return (
      <form className="entrybox" onSubmit={this.onSubmit}>
        <input
          ref={this.entryInput}
          type="text"
          aria-label="Cell contents"
          defaultValue={this.props.fill}
          autoFocus={true}
          autoCapitalize="characters"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="done"
          onKeyDown={this.onEntryKeyDown}
          onBlur={this.onEntryBlur}
        />
        <button type="submit">Done</button>
      </form>
    );
  }

  renderKey(key: string, label: string, name?: string) {
    return (
      <button
        key={key}
        type="button"
        className={name ? `key ${key}` : "key"}
        data-key={key}
        aria-label={name}
        onPointerDown={this.onKey}
      >
        {label}
      </button>
    );
  }

  renderKeys() {
    const rows = ROWS.map((letters, i) => {
      const keys = Array.from(letters, (l) => this.renderKey(l, l));
      if (i === ROWS.length - 1) {
        keys.unshift(
          <button
            key="entry"
            type="button"
            className="key entry"
            aria-label="Other characters"
            onClick={this.openEntry}
          >
            ...
          </button>
        );
        keys.push(this.renderKey("delete", "⌫", "Backspace"));
      }
      return (
        <div className="keyrow" key={i}>
          {keys}
        </div>
      );
    });
    return <>{rows}</>;
  }

  render() {
    return (
      <div id="keyboard" ref={this.root}>
        {this.state.entry ? this.renderEntry() : this.renderKeys()}
      </div>
    );
  }
}
