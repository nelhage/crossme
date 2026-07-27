import { createContext, useContext } from "react";

import type { Client } from "@connectrpc/connect";

import * as Types from "./types";
import { CrossMe } from "./pb/crossme_pb";
import type { Puzzle, Puzzle_Cell } from "./pb/puzzle_pb";

export type CrossMeClient = Client<typeof CrossMe>;

export const ClientContext = createContext<null | CrossMeClient>(null);

export function useClient(): CrossMeClient {
  const client = useContext(ClientContext);
  if (!client) {
    throw new Error("useClient called without a client in context");
  }
  return client;
}

function proto2Cell(sq: Puzzle_Cell): Types.Cell {
  if (sq.black) {
    return { black: true };
  }
  const cell: Types.LetterCell = {
    black: false,
    fill: sq.fill,
    circled: sq.circled,
    clueAcross: sq.clueAcross,
    clueDown: sq.clueDown,
  };
  // A square with no clue number comes back as 0; the client models
  // "no number" as the field being absent.
  if (sq.number !== 0) {
    cell.number = sq.number;
  }
  return cell;
}

export function proto2Puzzle(proto: Puzzle): Types.Puzzle {
  const meta = proto.metadata;
  if (!meta) {
    throw new Error("expected metadata");
  }
  return {
    id: meta.id,
    title: proto.title,
    author: proto.author,
    copyright: proto.copyright,
    note: proto.note,
    width: proto.width,
    height: proto.height,
    squares: proto.squares.map(proto2Cell),
    across_clues: proto.acrossClues.map((c) => ({
      number: c.number,
      text: c.text,
    })),
    down_clues: proto.downClues.map((c) => ({
      number: c.number,
      text: c.text,
    })),
  };
}
