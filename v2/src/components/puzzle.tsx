import React from "react";

import "./style/puzzle.css";

import * as Types from "../types";
import * as Crossword from "../crossword";

import { Metadata } from "./metadata";
import { PuzzleGrid } from "./puzzle_grid";
import { CurrentClue } from "./current_clue";
import { ClueBox } from "./clue_box";

export interface PuzzleProps {
  puzzle: Types.Puzzle;
}

export class PuzzleComponent extends React.Component<
  PuzzleProps,
  Crossword.Game
> {
  constructor(props: PuzzleProps) {
    super(props);
    this.state = Crossword.newGame(props.puzzle);

    this.onClickCell = this.onClickCell.bind(this);
    this.onSelectClue = this.onSelectClue.bind(this);
    this.keyDown = this.keyDown.bind(this);
    this.onInput = this.onInput.bind(this);
  }

  onInput(e: React.FormEvent<HTMLInputElement>) {
    const target = e.target as HTMLInputElement;
    const fill = target.value.toUpperCase();
    this.setState(game => Crossword.keypress(game, fill));
    target.value = "";
    e.preventDefault();
  }

  keyDown(e: KeyboardEvent) {
    const target = e.target;
    if (target instanceof HTMLElement) {
      if (target.nodeName === "INPUT" && target.classList.contains("fill")) {
        if (e.key === "Enter") {
          target.blur();
          e.preventDefault();
          // Session.set("rebus", false);
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
        this.setState(game => Crossword.nextClue(game, e.shiftKey));
        break;
      case "Enter":
        this.setState(Crossword.swapDirection);
        break;
      case "Delete":
      case "Backspace":
        this.setState(Crossword.deleteKey);
      default:
        return;
    }
    e.preventDefault();
  }

  arrow(dr: number, dc: number) {
    const direction = dr ? Types.Direction.DOWN : Types.Direction.ACROSS;
    // TODO: settingArrows
    if (direction !== this.state.cursor.direction) {
      this.setState(state => Crossword.swapDirection(state));
      return;
    }
    this.setState(state => Crossword.move(state, dr, dc));
  }

  onClickCell({ row, column }: Types.Position) {
    const cell = this.props.puzzle.squares[row][column];
    if (!cell || cell.black) {
      return;
    }
    if (row === this.state.cursor.row && column === this.state.cursor.column) {
      this.setState(Crossword.swapDirection);
    } else {
      this.setState(game => Crossword.selectSquare(game, { row, column }));
    }
  }

  onSelectClue(evt: Types.SelectClueEvent) {
    this.setState(game => Crossword.selectClue(game, evt));
  }

  selectedClueNumber(): number {
    const square = Crossword.selectedSquare(this.state);
    return this.state.cursor.direction === Types.Direction.DOWN
      ? square.clue_down
      : square.clue_across;
  }

  direction(): Types.Direction {
    return this.state.cursor.direction;
  }

  selectedClue(): Types.Clue {
    const clues =
      this.direction() === Types.Direction.DOWN
        ? this.props.puzzle.down_clues
        : this.props.puzzle.across_clues;
    const num = this.selectedClueNumber();
    const clue = clues.find(c => c.number === num);
    if (clue) {
      return clue;
    }
    throw new Error("illegal clue");
  }

  componentDidMount() {
    window.addEventListener("keydown", this.keyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.keyDown);
  }

  render() {
    const sel = Crossword.selectedSquare(this.state);
    return (
      <div id="puzzle">
        <Metadata puzzle={this.props.puzzle} solved={false} />
        <CurrentClue clue={this.selectedClue()} direction={this.direction()} />
        <PuzzleGrid
          game={this.state}
          onClickCell={this.onClickCell}
          onInput={this.onInput}
          /*
            gameId={this.props.gameId}
          puzzle={this.props.puzzle}
          delegate={this.delegate} */
        />
        <ClueBox
          puzzle={this.props.puzzle}
          down_clue={sel.clue_down}
          across_clue={sel.clue_across}
          direction={this.direction()}
          onSelect={this.onSelectClue}
        />
      </div>
      /*
       */
      /*
        {this.props.gameId && (
          <Sidebar
            doReveal={this.reveal}
            doCheck={this.check}
            gameId={this.props.gameId}
            currentUser={this.props.currentUser}
          />
        )}
*/
    );
  }
}
