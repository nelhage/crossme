import React from "react";

import "./style/puzzle.css";

import { ConnectError } from "@connectrpc/connect";

import * as Types from "../types";
import * as Crossword from "../crossword";

import { ClientContext, type CrossMeClient } from "../rpc";
import { Metadata } from "./metadata";
import { PuzzleGrid } from "./puzzle_grid";
import { CurrentClue } from "./current_clue";
import { ClueBox } from "./clue_box";
import { Sidebar } from "./sidebar";

export interface PuzzleProps {
  puzzle: Types.Puzzle;
  gameId?: string;
  startGame?: () => void;
}

export interface PuzzleState {
  game: Crossword.Game;
}

export class PuzzleComponent extends React.Component<PuzzleProps, PuzzleState> {
  static contextType = ClientContext;
  declare context: React.ContextType<typeof ClientContext>;

  client(): CrossMeClient {
    if (!this.context) {
      throw new Error("PuzzleComponent without client!");
    }
    return this.context;
  }

  subscription?: AbortController;
  timeoutId?: number;
  reconnectDelay: number = 0;

  grid: React.RefObject<PuzzleGrid | null>;

  constructor(props: PuzzleProps) {
    super(props);
    this.state = {
      game: Crossword.newGame(props.puzzle),
    };
    this.grid = React.createRef();

    this.onClickCell = this.onClickCell.bind(this);
    this.onSelectClue = this.onSelectClue.bind(this);
    this.keyDown = this.keyDown.bind(this);
    this.onInput = this.onInput.bind(this);
    this.openRebus = this.openRebus.bind(this);
    this.setPencil = this.setPencil.bind(this);
    this.doReveal = this.doReveal.bind(this);
    this.doCheck = this.doCheck.bind(this);
  }

  updateGame(op: (g: Crossword.Game) => Crossword.GameUpdate) {
    this.setState((state) => {
      let update = op(state.game);
      if (state.game.nextError === undefined) {
        update = { ...update, fill: undefined };
      }
      const game = Crossword.withUpdate(state.game, update);
      if (update.fill && this.props.gameId) {
        if (game.nextError === undefined) {
          update.fill.complete = true;
        }
        this.client()
          .updateFill({
            gameId: this.props.gameId,
            nodeId: this.state.game.nodeID,
            fill: update.fill,
          })
          .catch((err) => {
            console.log("Error updating fill: %j", err);
          });
      }
      return {
        ...state,
        game,
      };
    });
  }

  openRebus() {
    if (this.grid.current && this.grid.current.activeCell.current) {
      this.grid.current.activeCell.current.setState({ rebus: true });
    }
  }

  setPencil(pencil: boolean) {
    this.updateGame((g) => Crossword.withPencil(g, pencil));
  }

  onInput(fill: string) {
    this.updateGame((game) => Crossword.keypress(game, fill.toUpperCase()));
  }

  keyDown(e: KeyboardEvent) {
    if (!this.props.gameId) {
      return;
    }

    const target = e.target;
    if (target instanceof HTMLElement) {
      if (target.nodeName === "INPUT" && target.classList.contains("fill")) {
        if (e.key === "Enter") {
          target.blur();
          e.preventDefault();
        }

        return;
      }
    }

    if (e.altKey || e.ctrlKey || e.metaKey) {
      return;
    }

    switch (e.key) {
      case "ArrowRight":
        this.arrow(0, 1);
        break;
      case "ArrowLeft":
        this.arrow(0, -1);
        break;
      case "ArrowUp":
        this.arrow(-1, 0);
        break;
      case "ArrowDown":
        this.arrow(1, 0);
        break;
      case "Tab":
        this.updateGame((game) => Crossword.nextBlank(game, e.shiftKey));
        break;
      case "Enter": {
        const fill = Crossword.fillAt(this.state.game, this.state.game.cursor);
        if (fill && fill.fill && fill.fill.length > 1) {
          this.openRebus();
        } else {
          this.updateGame(Crossword.swapDirection);
        }
        break;
      }
      case "Delete":
      case "Backspace":
        this.updateGame(Crossword.deleteKey);
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  arrow(dr: number, dc: number) {
    const direction = dr ? Types.Direction.DOWN : Types.Direction.ACROSS;
    // TODO: settingArrows
    if (direction !== this.state.game.cursor.direction) {
      this.updateGame((state) => Crossword.swapDirection(state));
      return;
    }
    this.updateGame((state) => Crossword.move(state, dr, dc));
  }

  onClickCell(pos: Types.Position) {
    const cell = Crossword.cellAt(this.props.puzzle, pos);
    if (!cell || cell.black) {
      return;
    }
    if (
      pos.row === this.state.game.cursor.row &&
      pos.column === this.state.game.cursor.column
    ) {
      const fill = Crossword.fillAt(this.state.game, this.state.game.cursor);
      if (fill && fill.fill && fill.fill.length > 1) {
        this.openRebus();
      } else {
        this.updateGame(Crossword.swapDirection);
      }
    } else {
      this.updateGame((game) => Crossword.selectSquare(game, pos));
    }
  }

  onSelectClue(evt: Types.SelectClueEvent) {
    this.updateGame((game) => Crossword.selectClue(game, evt));
  }

  doReveal(target: Crossword.Target) {
    this.updateGame((game) => Crossword.revealAnswers(game, target));
  }

  doCheck(target: Crossword.Target) {
    this.updateGame((game) => Crossword.checkAnswers(game, target));
  }

  selectedClueNumber(): number {
    const square = Crossword.selectedSquare(this.state.game);
    return this.state.game.cursor.direction === Types.Direction.DOWN
      ? square.clueDown
      : square.clueAcross;
  }

  direction(): Types.Direction {
    return this.state.game.cursor.direction;
  }

  selectedClue(): Types.Clue {
    const clues =
      this.direction() === Types.Direction.DOWN
        ? this.props.puzzle.down_clues
        : this.props.puzzle.across_clues;
    const num = this.selectedClueNumber();
    const clue = clues.find((c) => c.number === num);
    if (clue) {
      return clue;
    }
    throw new Error("illegal clue");
  }

  reconnect() {
    this.stopSubscription();
    this.timeoutId = window.setTimeout(() => {
      this.startSubscription();
    }, this.reconnectDelay);
  }

  startSubscription() {
    const gameId = this.props.gameId;
    if (!gameId) {
      return;
    }
    const sub = new AbortController();
    this.subscription = sub;
    void this.runSubscription(gameId, sub);
  }

  // Reads the server-streaming Subscribe RPC until it fails or the server
  // closes it, then schedules a reconnect (unless we cancelled it ourselves).
  async runSubscription(gameId: string, sub: AbortController) {
    try {
      for await (const ev of this.client().subscribe(
        { gameId, nodeId: this.state.game.nodeID },
        { signal: sub.signal }
      )) {
        this.reconnectDelay = 0;
        const fill = ev.fill;
        if (!fill) {
          continue;
        }
        this.setState((state) => ({
          ...state,
          game: Crossword.withUpdate(state.game, { fill }),
        }));
      }
      this.reconnectDelay = Math.max(100, this.reconnectDelay);
    } catch (e) {
      if (sub.signal.aborted) {
        return;
      }
      this.reconnectDelay = Math.max(this.reconnectDelay, 100);
      this.reconnectDelay *= 1.5;
      this.reconnectDelay = Math.min(this.reconnectDelay, 30 * 1000);
      console.log(
        "subscription errored: %s. Reconnecting in %fs",
        ConnectError.from(e).message,
        this.reconnectDelay / 1000
      );
    }
    if (!sub.signal.aborted) {
      this.reconnect();
    }
  }

  stopSubscription() {
    if (this.subscription) {
      this.subscription.abort();
      this.subscription = undefined;
    }
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }

  componentDidMount() {
    window.addEventListener("keydown", this.keyDown);
    this.startSubscription();
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.keyDown);
    this.stopSubscription();
  }

  render() {
    const sel = Crossword.selectedSquare(this.state.game);
    const playing = this.props.gameId ? true : undefined;
    return (
      <div id="puzzle">
        <Metadata
          puzzle={this.props.puzzle}
          solved={this.state.game.nextError === undefined}
          preview={!playing}
          startGame={this.props.startGame}
        />
        {playing && (
          <CurrentClue
            clue={this.selectedClue()}
            direction={this.direction()}
          />
        )}
        <PuzzleGrid
          ref={this.grid}
          game={this.state.game}
          onClickCell={this.onClickCell}
          onInput={this.onInput}
          showCursor={playing}
        />
        <ClueBox
          puzzle={this.props.puzzle}
          down_clue={playing && sel.clueDown}
          across_clue={playing && sel.clueAcross}
          direction={this.direction()}
          onSelect={this.onSelectClue}
        />
        {playing && (
          <Sidebar
            openRebus={this.openRebus}
            pencil={this.state.game.cursor.pencil}
            setPencil={this.setPencil}
            doReveal={this.doReveal}
            doCheck={this.doCheck}
          />
        )}
      </div>
    );
  }
}
