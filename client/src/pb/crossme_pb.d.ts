import * as jspb from "google-protobuf"

import * as puzzle_pb from './puzzle_pb';
import * as fill_pb from './fill_pb';
import * as game_pb from './game_pb';

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

export class NewGameArgs extends jspb.Message {
  getPuzzleId(): string;
  setPuzzleId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NewGameArgs.AsObject;
  static toObject(includeInstance: boolean, msg: NewGameArgs): NewGameArgs.AsObject;
  static serializeBinaryToWriter(message: NewGameArgs, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NewGameArgs;
  static deserializeBinaryFromReader(message: NewGameArgs, reader: jspb.BinaryReader): NewGameArgs;
}

export namespace NewGameArgs {
  export type AsObject = {
    puzzleId: string,
  }
}

export class NewGameResponse extends jspb.Message {
  getGame(): game_pb.Game | undefined;
  setGame(value?: game_pb.Game): void;
  hasGame(): boolean;
  clearGame(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NewGameResponse.AsObject;
  static toObject(includeInstance: boolean, msg: NewGameResponse): NewGameResponse.AsObject;
  static serializeBinaryToWriter(message: NewGameResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NewGameResponse;
  static deserializeBinaryFromReader(message: NewGameResponse, reader: jspb.BinaryReader): NewGameResponse;
}

export namespace NewGameResponse {
  export type AsObject = {
    game?: game_pb.Game.AsObject,
  }
}

export class GetGameByIdArgs extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetGameByIdArgs.AsObject;
  static toObject(includeInstance: boolean, msg: GetGameByIdArgs): GetGameByIdArgs.AsObject;
  static serializeBinaryToWriter(message: GetGameByIdArgs, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetGameByIdArgs;
  static deserializeBinaryFromReader(message: GetGameByIdArgs, reader: jspb.BinaryReader): GetGameByIdArgs;
}

export namespace GetGameByIdArgs {
  export type AsObject = {
    id: string,
  }
}

export class GetGameResponse extends jspb.Message {
  getGame(): game_pb.Game | undefined;
  setGame(value?: game_pb.Game): void;
  hasGame(): boolean;
  clearGame(): void;

  getPuzzle(): puzzle_pb.Puzzle | undefined;
  setPuzzle(value?: puzzle_pb.Puzzle): void;
  hasPuzzle(): boolean;
  clearPuzzle(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetGameResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetGameResponse): GetGameResponse.AsObject;
  static serializeBinaryToWriter(message: GetGameResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetGameResponse;
  static deserializeBinaryFromReader(message: GetGameResponse, reader: jspb.BinaryReader): GetGameResponse;
}

export namespace GetGameResponse {
  export type AsObject = {
    game?: game_pb.Game.AsObject,
    puzzle?: puzzle_pb.Puzzle.AsObject,
  }
}

export class UploadPuzzleArgs extends jspb.Message {
  getFilename(): string;
  setFilename(value: string): void;

  getData(): Uint8Array | string;
  getData_asU8(): Uint8Array;
  getData_asB64(): string;
  setData(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UploadPuzzleArgs.AsObject;
  static toObject(includeInstance: boolean, msg: UploadPuzzleArgs): UploadPuzzleArgs.AsObject;
  static serializeBinaryToWriter(message: UploadPuzzleArgs, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UploadPuzzleArgs;
  static deserializeBinaryFromReader(message: UploadPuzzleArgs, reader: jspb.BinaryReader): UploadPuzzleArgs;
}

export namespace UploadPuzzleArgs {
  export type AsObject = {
    filename: string,
    data: Uint8Array | string,
  }
}

export class UploadPuzzleResponse extends jspb.Message {
  getPuzzle(): puzzle_pb.Puzzle | undefined;
  setPuzzle(value?: puzzle_pb.Puzzle): void;
  hasPuzzle(): boolean;
  clearPuzzle(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UploadPuzzleResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UploadPuzzleResponse): UploadPuzzleResponse.AsObject;
  static serializeBinaryToWriter(message: UploadPuzzleResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UploadPuzzleResponse;
  static deserializeBinaryFromReader(message: UploadPuzzleResponse, reader: jspb.BinaryReader): UploadPuzzleResponse;
}

export namespace UploadPuzzleResponse {
  export type AsObject = {
    puzzle?: puzzle_pb.Puzzle.AsObject,
  }
}

export class SubscribeArgs extends jspb.Message {
  getGameId(): string;
  setGameId(value: string): void;

  getNodeId(): string;
  setNodeId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SubscribeArgs.AsObject;
  static toObject(includeInstance: boolean, msg: SubscribeArgs): SubscribeArgs.AsObject;
  static serializeBinaryToWriter(message: SubscribeArgs, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SubscribeArgs;
  static deserializeBinaryFromReader(message: SubscribeArgs, reader: jspb.BinaryReader): SubscribeArgs;
}

export namespace SubscribeArgs {
  export type AsObject = {
    gameId: string,
    nodeId: string,
  }
}

export class SubscribeEvent extends jspb.Message {
  getFill(): fill_pb.Fill | undefined;
  setFill(value?: fill_pb.Fill): void;
  hasFill(): boolean;
  clearFill(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SubscribeEvent.AsObject;
  static toObject(includeInstance: boolean, msg: SubscribeEvent): SubscribeEvent.AsObject;
  static serializeBinaryToWriter(message: SubscribeEvent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SubscribeEvent;
  static deserializeBinaryFromReader(message: SubscribeEvent, reader: jspb.BinaryReader): SubscribeEvent;
}

export namespace SubscribeEvent {
  export type AsObject = {
    fill?: fill_pb.Fill.AsObject,
  }
}

export class UpdateFillArgs extends jspb.Message {
  getGameId(): string;
  setGameId(value: string): void;

  getNodeId(): string;
  setNodeId(value: string): void;

  getFill(): fill_pb.Fill | undefined;
  setFill(value?: fill_pb.Fill): void;
  hasFill(): boolean;
  clearFill(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateFillArgs.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateFillArgs): UpdateFillArgs.AsObject;
  static serializeBinaryToWriter(message: UpdateFillArgs, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateFillArgs;
  static deserializeBinaryFromReader(message: UpdateFillArgs, reader: jspb.BinaryReader): UpdateFillArgs;
}

export namespace UpdateFillArgs {
  export type AsObject = {
    gameId: string,
    nodeId: string,
    fill?: fill_pb.Fill.AsObject,
  }
}

export class UpdateFillResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateFillResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateFillResponse): UpdateFillResponse.AsObject;
  static serializeBinaryToWriter(message: UpdateFillResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateFillResponse;
  static deserializeBinaryFromReader(message: UpdateFillResponse, reader: jspb.BinaryReader): UpdateFillResponse;
}

export namespace UpdateFillResponse {
  export type AsObject = {
  }
}

