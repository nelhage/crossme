import { useEffect, useMemo, useRef, useState } from "react";

import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { Link, NavigateFunction, useNavigate } from "react-router";

import { timestampDate, type Timestamp } from "@bufbuild/protobuf/wkt";

import type { UploadPuzzleResponse } from "../pb/crossme_pb";
import type { PuzzleIndex, PuzzleIndex_Game } from "../pb/puzzle_pb";
import { dayParts, groupByMonth, matchesQuery } from "../puzzle_index";
import { ensureSynced } from "../recent_games_sync";
import { useClient, type CrossMeClient } from "../rpc";
import { useUser } from "../user";

import "./style/puzzles.css";

function readFile(f: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => {
      reject(fr.error);
    };
    fr.onload = () => {
      resolve(new Uint8Array(fr.result as ArrayBuffer));
    };
    fr.readAsArrayBuffer(f);
  });
}

async function uploadFiles(
  client: CrossMeClient,
  navigate: NavigateFunction,
  files: FileList
) {
  if (files.length === 0) {
    return;
  }
  let resp: null | UploadPuzzleResponse = null;
  for (const file of files) {
    const buf = await readFile(file);
    resp = await client.uploadPuzzle({ filename: file.name, data: buf });
  }
  const meta = resp?.puzzle?.metadata;
  if (!meta) {
    return;
  }
  navigate(`/preview/${meta.id}`);
}

const UploadPuzzle = () => {
  const client = useClient();
  const navigate = useNavigate();
  const files = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<null | string>(null);

  const handleUpload = () => {
    const fileList = files.current?.files;
    if (!fileList) {
      return;
    }
    setError(null);
    uploadFiles(client, navigate, fileList).catch((err) => {
      console.log("unable to upload puzzle: ", err);
      setError(String(err));
    });
  };

  return (
    <Form className="upload-puzzle">
      <Form.Label htmlFor="puzfile">
        Upload a{" "}
        <a href="https://code.google.com/p/puz/wiki/FileFormat">.puz</a> or .jpz
        file:
      </Form.Label>
      <div className="upload-controls">
        <Form.Control
          id="puzfile"
          type="file"
          accept=".puz,.jpz,.xml"
          ref={files}
          multiple
        />
        <Button variant="primary" onClick={handleUpload}>
          Upload
        </Button>
      </div>
      {error && <div className="text-danger">{error}</div>}
    </Form>
  );
};

// Some sources put the "by" (and stray whitespace) in the author field
// already.
function byline(author: string): string {
  const trimmed = author.trim();
  return /^by\s/i.test(trimmed) ? trimmed : `by ${trimmed}`;
}

// A calendar-tile date: weekday over day-of-month. Always rendered, so
// undated rows keep their titles aligned with the rest.
const PuzzleDay = ({ date }: { date: string }) => {
  const parts = dayParts(date);
  if (!parts) {
    return <span className="date" aria-hidden="true" />;
  }
  return (
    <time className="date" dateTime={date} title={parts.full}>
      <span className="weekday">{parts.weekday}</span>
      <span className="day">{parts.day}</span>
    </time>
  );
};

// A 4x4 crossword grid, 16 units square. `filled` marks the cells (by
// index, row-major) that read as written in; the rest are blank, and two
// are black squares so it reads as a crossword rather than a table.
const GridIcon = ({ filled }: { filled: number[] }) => {
  const black = [5, 10];
  const cells = [];
  for (let i = 0; i < 16; i++) {
    const x = (i % 4) * 4;
    const y = Math.floor(i / 4) * 4;
    if (black.includes(i)) {
      cells.push(
        <rect key={i} className="black" x={x} y={y} width="4" height="4" />
      );
    } else if (filled.includes(i)) {
      cells.push(
        <rect key={i} className="filled" x={x} y={y} width="4" height="4" />
      );
    }
  }
  return (
    <>
      {cells}
      <path
        className="lines"
        d="M4 0v16M8 0v16M12 0v16M0 4h16M0 8h16M0 12h16M0.5 0.5h15v15h-15z"
      />
    </>
  );
};

function formatDate(ts: Timestamp): string {
  return timestampDate(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// The caller's game of a puzzle: a grid with a green check for a solved
// game, or a half-filled grid for one in progress. Links to the game.
const GameStatus = ({
  game,
  title,
}: {
  game: PuzzleIndex_Game;
  title: string;
}) => {
  const solved = game.completedAt !== undefined;
  const label = solved ? `Solved: ${title}` : `In progress: ${title}`;
  const when = game.completedAt
    ? `Solved ${formatDate(game.completedAt)}`
    : game.lastPlayed
      ? `In progress, last played ${formatDate(game.lastPlayed)}`
      : undefined;
  return (
    <Link
      to={`/game/${game.id}`}
      className={`game-status ${solved ? "solved" : "in-progress"}`}
      aria-label={label}
      title={when}
    >
      <svg viewBox="0 0 20 20" width="1.5em" height="1.5em" aria-hidden="true">
        {solved ? (
          <>
            <GridIcon
              filled={[0, 1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 15]}
            />
            <circle className="check-bg" cx="15" cy="15" r="5" />
            <path
              className="check"
              d="M12.2 15.2l1.9 1.9 3.7-3.9"
              fill="none"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : (
          <GridIcon filled={[0, 1, 2, 4, 8, 9, 12]} />
        )}
      </svg>
    </Link>
  );
};

const PuzzleRow = ({ puzzle }: { puzzle: PuzzleIndex }) => {
  const client = useClient();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  const newGame = () => {
    setStarting(true);
    client.newGame({ puzzleId: puzzle.id }).then(
      (resp) => {
        if (resp.game) {
          navigate(`/game/${resp.game.id}`, { state: { puzzleId: puzzle.id } });
        } else {
          setStarting(false);
        }
      },
      (err) => {
        console.log("unable to create new game: ", err);
        setStarting(false);
      }
    );
  };

  return (
    <li className="puzzle-row">
      <PuzzleDay date={puzzle.date} />
      <span className="details">
        <Link className="title" to={`/preview/${puzzle.id}`}>
          {puzzle.title || "Untitled puzzle"}
        </Link>
        {puzzle.author && (
          <span className="author">{byline(puzzle.author)}</span>
        )}
      </span>
      {puzzle.game && (
        <GameStatus
          game={puzzle.game}
          title={puzzle.title || "Untitled puzzle"}
        />
      )}
      <Button
        size="sm"
        variant="primary"
        onClick={newGame}
        disabled={starting}
        aria-label={`Solve ${puzzle.title || "Untitled puzzle"}`}
      >
        Solve
      </Button>
    </li>
  );
};

// Every puzzle on the server, newest first and grouped by month, with a
// search box that narrows the list as you type. Each row links to the
// puzzle's preview and can start a game directly; for a signed-in user,
// rows for puzzles they have played also link to their game.
export const Puzzles = () => {
  const client = useClient();
  const { user } = useUser();
  const [index, setIndex] = useState<null | PuzzleIndex[]>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  // Refetch on sign-in/sign-out: the index carries the caller's games,
  // so the same RPC answers differently depending on the session.
  const userId = user?.id;
  useEffect(() => {
    let cancelled = false;
    // Fold this browser's pre-sign-in games into the account first, so
    // they show up on the list right away.
    const synced = userId ? ensureSynced(client, userId) : Promise.resolve();
    synced
      .then(() => client.getPuzzleIndex({}))
      .then(
        (resp) => {
          if (!cancelled) {
            setIndex(resp.puzzles);
          }
        },
        (err) => {
          console.log("unable to load puzzle index: ", err);
          if (!cancelled) {
            setError(true);
          }
        }
      );
    return () => {
      cancelled = true;
    };
  }, [client, userId]);

  const groups = useMemo(
    () => groupByMonth((index ?? []).filter((puz) => matchesQuery(puz, query))),
    [index, query]
  );

  return (
    <div className="container" id="puzzles">
      <h2>Puzzles</h2>

      <Form.Control
        type="search"
        className="puzzle-search"
        placeholder="Search by title, author, or date…"
        aria-label="Search puzzles"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {error ? (
        <p>Something went wrong loading the puzzles. Try reloading?</p>
      ) : index === null ? (
        <p>Loading…</p>
      ) : index.length === 0 ? (
        <p>There are no puzzles yet. Upload one below to get started!</p>
      ) : groups.length === 0 ? (
        <p>No puzzles match &quot;{query}&quot;.</p>
      ) : (
        groups.map((group) => (
          <section key={group.month} className="puzzle-month">
            <h3>{group.label}</h3>
            <ul>
              {group.puzzles.map((puz) => (
                <PuzzleRow key={puz.id} puzzle={puz} />
              ))}
            </ul>
          </section>
        ))
      )}

      <hr />

      <UploadPuzzle />
    </div>
  );
};
