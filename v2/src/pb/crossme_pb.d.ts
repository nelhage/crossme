import * as jspb from "google-protobuf"

import * as puzzle_pb from './puzzle_pb';

export class GetPuzzleByIdArgs extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetPuzzleByIdArgs.AsObject;
  static toObject(includeInstance: boolean, msg: GetPuzzleByIdArgs): GetPuzzleByIdArgs.AsObject;
  static serializeBinaryToWriter(message: GetPuzzleByIdArgs, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetPuzzleByIdArgs;
  static deserializeBinaryFromReader(message: GetPuzzleByIdArgs, reader: jspb.BinaryReader): GetPuzzleByIdArgs;
}

export namespace GetPuzzleByIdArgs {
  export type AsObject = {
    id: string,
  }
}

export class GetPuzzleResponse extends jspb.Message {
  getPuzzle(): puzzle_pb.Puzzle | undefined;
  setPuzzle(value?: puzzle_pb.Puzzle): void;
  hasPuzzle(): boolean;
  clearPuzzle(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetPuzzleResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetPuzzleResponse): GetPuzzleResponse.AsObject;
  static serializeBinaryToWriter(message: GetPuzzleResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetPuzzleResponse;
  static deserializeBinaryFromReader(message: GetPuzzleResponse, reader: jspb.BinaryReader): GetPuzzleResponse;
}

export namespace GetPuzzleResponse {
  export type AsObject = {
    puzzle?: puzzle_pb.Puzzle.AsObject,
  }
}

