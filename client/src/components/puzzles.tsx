import { useEffect, useMemo, useRef, useState } from "react";

import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { Link, NavigateFunction, useNavigate } from "react-router";

import type { UploadPuzzleResponse } from "../pb/crossme_pb";
import type { PuzzleIndex } from "../pb/puzzle_pb";
import { dayParts, groupByMonth, matchesQuery } from "../puzzle_index";
import { useClient, type CrossMeClient } from "../rpc";

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
// puzzle's preview and can start a game directly.
export const Puzzles = () => {
  const client = useClient();
  const [index, setIndex] = useState<null | PuzzleIndex[]>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    client.getPuzzleIndex({}).then(
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
  }, [client]);

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
