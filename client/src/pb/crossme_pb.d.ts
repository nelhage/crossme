import * as jspb from "google-protobuf"

import * as puzzle_pb from './puzzle_pb';
import * as fill_pb from './fill_pb';

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

export class InteractEvent extends jspb.Message {
  getInitialize(): InteractEvent.Initialize | undefined;
  setInitialize(value?: InteractEvent.Initialize): void;
  hasInitialize(): boolean;
  clearInitialize(): void;

  getFillChanged(): InteractEvent.FillChanged | undefined;
  setFillChanged(value?: InteractEvent.FillChanged): void;
  hasFillChanged(): boolean;
  clearFillChanged(): void;

  getEventCase(): InteractEvent.EventCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InteractEvent.AsObject;
  static toObject(includeInstance: boolean, msg: InteractEvent): InteractEvent.AsObject;
  static serializeBinaryToWriter(message: InteractEvent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InteractEvent;
  static deserializeBinaryFromReader(message: InteractEvent, reader: jspb.BinaryReader): InteractEvent;
}

export namespace InteractEvent {
  export type AsObject = {
    initialize?: InteractEvent.Initialize.AsObject,
    fillChanged?: InteractEvent.FillChanged.AsObject,
  }

  export class Initialize extends jspb.Message {
    getPuzzleId(): string;
    setPuzzleId(value: string): void;

    getNodeId(): string;
    setNodeId(value: string): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Initialize.AsObject;
    static toObject(includeInstance: boolean, msg: Initialize): Initialize.AsObject;
    static serializeBinaryToWriter(message: Initialize, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Initialize;
    static deserializeBinaryFromReader(message: Initialize, reader: jspb.BinaryReader): Initialize;
  }

  export namespace Initialize {
    export type AsObject = {
      puzzleId: string,
      nodeId: string,
    }
  }


  export class FillChanged extends jspb.Message {
    getFill(): fill_pb.Fill | undefined;
    setFill(value?: fill_pb.Fill): void;
    hasFill(): boolean;
    clearFill(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): FillChanged.AsObject;
    static toObject(includeInstance: boolean, msg: FillChanged): FillChanged.AsObject;
    static serializeBinaryToWriter(message: FillChanged, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): FillChanged;
    static deserializeBinaryFromReader(message: FillChanged, reader: jspb.BinaryReader): FillChanged;
  }

  export namespace FillChanged {
    export type AsObject = {
      fill?: fill_pb.Fill.AsObject,
    }
  }


  export enum EventCase { 
    EVENT_NOT_SET = 0,
    INITIALIZE = 1,
    FILL_CHANGED = 2,
  }
}

export class InteractResponse extends jspb.Message {
  getFill(): fill_pb.Fill | undefined;
  setFill(value?: fill_pb.Fill): void;
  hasFill(): boolean;
  clearFill(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InteractResponse.AsObject;
  static toObject(includeInstance: boolean, msg: InteractResponse): InteractResponse.AsObject;
  static serializeBinaryToWriter(message: InteractResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InteractResponse;
  static deserializeBinaryFromReader(message: InteractResponse, reader: jspb.BinaryReader): InteractResponse;
}

export namespace InteractResponse {
  export type AsObject = {
    fill?: fill_pb.Fill.AsObject,
  }
}

