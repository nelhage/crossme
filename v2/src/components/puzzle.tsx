import React from "react";

import "./style/puzzle.css";

import * as Types from "../types";
import * as Crossword from "../crossword";

import { Metadata } from "./metadata";
import { PuzzleGrid } from "./puzzle_grid";
import { CurrentClue } from "./current_clue";
import { ClueBox } from "./clue_box";
import { Sidebar } from "./sidebar";

export interface PuzzleProps {
  puzzle: Types.Puzzle;
}

export class PuzzleComponent extends React.Component<
  PuzzleProps,
  Crossword.Game
> {
  grid: React.RefObject<PuzzleGrid>;

  constructor(props: PuzzleProps) {
    super(props);
    this.state = Crossword.newGame(props.puzzle);
    this.grid = React.createRef();

    this.onClickCell = this.onClickCell.bind(this);
    this.onSelectClue = this.onSelectClue.bind(this);
    this.keyDown = this.keyDown.bind(this);
    this.onInput = this.onInput.bind(this);
    this.openRebus = this.openRebus.bind(this);
  }

  openRebus() {
    if (this.grid.current && this.grid.current.activeCell.current) {
      this.grid.current.activeCell.current.setState({ rebus: true });
    }
  }

  onInput(fill: string) {
    this.setState(game => Crossword.keypress(game, fill.toUpperCase()));
  }

  keyDown(e: KeyboardEvent) {
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
        this.setState(game => Crossword.nextBlank(game, e.shiftKey));
        break;
      case "Enter":
        const fill = Crossword.fillAt(this.state, this.state.cursor);
        if (fill && fill.fill && fill.fill.length > 1) {
          this.openRebus();
        } else {
          this.setState(Crossword.swapDirection);
        }
        break;
      case "Delete":
      case "Backspace":
        this.setState(Crossword.deleteKey);
        break;
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
      const fill = Crossword.fillAt(this.state, this.state.cursor);
      if (fill && fill.fill && fill.fill.length > 1) {
        this.openRebus();
      } else {
        this.setState(Crossword.swapDirection);
      }
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
          ref={this.grid}
          game={this.state}
          onClickCell={this.onClickCell}
          onInput={this.onInput}
        />
        <ClueBox
          puzzle={this.props.puzzle}
          down_clue={sel.clue_down}
          across_clue={sel.clue_across}
          direction={this.direction()}
          onSelect={this.onSelectClue}
        />
        <Sidebar
          openRebus={this.openRebus}
          /*
      doReveal={this.reveal}
      doCheck={this.check}
      gameId={this.props.gameId}
      currentUser={this.props.currentUser}
      */
        />
      </div>
    );
  }
}
