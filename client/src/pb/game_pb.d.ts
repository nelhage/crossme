import * as jspb from "google-protobuf"

import * as fill_pb from './fill_pb';
import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';

export class Game extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getPuzzleId(): string;
  setPuzzleId(value: string): void;

  getFill(): fill_pb.Fill | undefined;
  setFill(value?: fill_pb.Fill): void;
  hasFill(): boolean;
  clearFill(): void;

  getCreated(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreated(value?: google_protobuf_timestamp_pb.Timestamp): void;
  hasCreated(): boolean;
  clearCreated(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Game.AsObject;
  static toObject(includeInstance: boolean, msg: Game): Game.AsObject;
  static serializeBinaryToWriter(message: Game, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Game;
  static deserializeBinaryFromReader(message: Game, reader: jspb.BinaryReader): Game;
}

export namespace Game {
  export type AsObject = {
    id: string,
    puzzleId: string,
    fill?: fill_pb.Fill.AsObject,
    created?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

