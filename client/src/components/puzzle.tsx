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

export interface PuzzleState {
  game: Crossword.Game;
}

export class PuzzleComponent extends React.Component<PuzzleProps, PuzzleState> {
  grid: React.RefObject<PuzzleGrid>;

  constructor(props: PuzzleProps) {
    super(props);
    this.state = {
      game: Crossword.newGame(props.puzzle)
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
    this.setState(state => ({
      ...state,
      game: Crossword.withUpdate(state.game, op(state.game))
    }));
  }

  openRebus() {
    if (this.grid.current && this.grid.current.activeCell.current) {
      this.grid.current.activeCell.current.setState({ rebus: true });
    }
  }

  setPencil(pencil: boolean) {
    this.updateGame(g => Crossword.withPencil(g, pencil));
  }

  onInput(fill: string) {
    this.updateGame(game => Crossword.keypress(game, fill.toUpperCase()));
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
        this.updateGame(game => Crossword.nextBlank(game, e.shiftKey));
        break;
      case "Enter":
        const fill = Crossword.fillAt(this.state.game, this.state.game.cursor);
        if (fill && fill.fill && fill.fill.length > 1) {
          this.openRebus();
        } else {
          this.updateGame(Crossword.swapDirection);
        }
        break;
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
      this.updateGame(state => Crossword.swapDirection(state));
      return;
    }
    this.updateGame(state => Crossword.move(state, dr, dc));
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
      this.updateGame(game => Crossword.selectSquare(game, pos));
    }
  }

  onSelectClue(evt: Types.SelectClueEvent) {
    this.updateGame(game => Crossword.selectClue(game, evt));
  }

  doReveal(target: Crossword.Target) {
    this.updateGame(game => Crossword.revealAnswers(game, target));
  }

  doCheck(target: Crossword.Target) {
    this.updateGame(game => Crossword.checkAnswers(game, target));
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
    const sel = Crossword.selectedSquare(this.state.game);
    return (
      <div id="puzzle">
        <Metadata puzzle={this.props.puzzle} solved={false} />
        <CurrentClue clue={this.selectedClue()} direction={this.direction()} />
        <PuzzleGrid
          ref={this.grid}
          game={this.state.game}
          onClickCell={this.onClickCell}
          onInput={this.onInput}
        />
        <ClueBox
          puzzle={this.props.puzzle}
          down_clue={sel.clueDown}
          across_clue={sel.clueAcross}
          direction={this.direction()}
          onSelect={this.onSelectClue}
        />
        <Sidebar
          openRebus={this.openRebus}
          pencil={this.state.game.cursor.pencil}
          setPencil={this.setPencil}
          doReveal={this.doReveal}
          doCheck={this.doCheck}
        />
      </div>
    );
  }
}
