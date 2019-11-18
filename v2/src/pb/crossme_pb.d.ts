import * as jspb from "google-protobuf"

import * as puzzle_pb from './puzzle_pb';

export class GetPuzzleIndexArgs extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetPuzzleIndexArgs.AsObject;
  static toObject(includeInstance: boolean, msg: GetPuzzleIndexArgs): GetPuzzleIndexArgs.AsObject;
  static serializeBinaryToWriter(message: GetPuzzleIndexArgs, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetPuzzleIndexArgs;
  static deserializeBinaryFromReader(message: GetPuzzleIndexArgs, reader: jspb.BinaryReader): GetPuzzleIndexArgs;
}

export namespace GetPuzzleIndexArgs {
  export type AsObject = {
  }
}

export class GetPuzzleIndexResponse extends jspb.Message {
  getPuzzlesList(): Array<puzzle_pb.PuzzleIndex>;
  setPuzzlesList(value: Array<puzzle_pb.PuzzleIndex>): void;
  clearPuzzlesList(): void;
  addPuzzles(value?: puzzle_pb.PuzzleIndex, index?: number): puzzle_pb.PuzzleIndex;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetPuzzleIndexResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetPuzzleIndexResponse): GetPuzzleIndexResponse.AsObject;
  static serializeBinaryToWriter(message: GetPuzzleIndexResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetPuzzleIndexResponse;
  static deserializeBinaryFromReader(message: GetPuzzleIndexResponse, reader: jspb.BinaryReader): GetPuzzleIndexResponse;
}

export namespace GetPuzzleIndexResponse {
  export type AsObject = {
    puzzlesList: Array<puzzle_pb.PuzzleIndex.AsObject>,
  }
}

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
