import React, { useContext } from "react";

import * as Types from "./types";
import { Puzzle } from "./pb/puzzle_pb";

import { CrossMeClient } from "./pb/CrossmeServiceClientPb";

export const ClientContext = React.createContext<CrossMeClient>(
  (null as unknown) as CrossMeClient
);

export function useClient(): CrossMeClient {
  return useContext(ClientContext);
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
    squares: proto.getSquaresList().map(sq => {
      const conv = sq.toObject();
      if (conv.number === 0) {
        delete conv.number;
      }
      return conv;
    }),
    across_clues: proto.getAcrossCluesList().map(c => c.toObject()),
    down_clues: proto.getDownCluesList().map(c => c.toObject())
  };
}
