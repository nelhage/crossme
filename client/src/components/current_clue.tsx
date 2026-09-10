import { Clue, Direction } from "../types";

export interface CurrentClueProps {
  clue: Clue;
  direction: Direction;
  onPrev: () => void;
  onNext: () => void;
  onToggle: () => void;
}

export const CurrentClue = ({
  clue,
  direction,
  onPrev,
  onNext,
  onToggle,
}: CurrentClueProps) => (
  <div id="theclue">
    <button
      type="button"
      className="clue-nav prev"
      aria-label="Previous clue"
      onClick={onPrev}
    >
      &lsaquo;
    </button>
    <span className="body" title="Switch direction" onClick={onToggle}>
      <span className="badge bg-secondary">
        <span className="number">{clue.number}</span>
        <span className="direction"> {direction}</span>
      </span>
      <span className="text">{clue.text}</span>
    </span>
    <button
      type="button"
      className="clue-nav next"
      aria-label="Next clue"
      onClick={onNext}
    >
      &rsaquo;
    </button>
    <div className="clear" />
  </div>
);
