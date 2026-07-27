import { createContext, useContext } from "react";

import * as Types from "./types";
import { Puzzle } from "./pb/puzzle_pb";

import { CrossMeClient } from "./pb/CrossmeServiceClientPb";

export const ClientContext = createContext<null | CrossMeClient>(null);

export function useClient(): CrossMeClient {
  const client = useContext(ClientContext);
  if (!client) {
    throw new Error("useClient called without a client in context");
  }
  return client;
}

export function proto2Puzzle(proto: Puzzle): Types.Puzzle {
  const meta = proto.getMetadata();
  if (!meta) {
    throw new Error("expected metadata");
  }
  return {
    id: meta.getId(),
    title: proto.getTitle(),
    author: proto.getAuthor(),
    copyright: proto.getCopyright(),
    note: proto.getNote(),
    width: proto.getWidth(),
    height: proto.getHeight(),
    squares: proto.getSquaresList().map((sq) => {
      // A square with no clue number comes back as 0; the client models
      // "no number" as the field being absent.
      const { number, ...rest } = sq.toObject();
      return number === 0 ? rest : { ...rest, number };
    }),
    across_clues: proto.getAcrossCluesList().map((c) => c.toObject()),
    down_clues: proto.getDownCluesList().map((c) => c.toObject()),
  };
}
