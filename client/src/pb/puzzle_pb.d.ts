import * as jspb from 'google-protobuf'

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';


export class Puzzle extends jspb.Message {
  getTitle(): string;
  setTitle(value: string): Puzzle;

  getAuthor(): string;
  setAuthor(value: string): Puzzle;

  getCopyright(): string;
  setCopyright(value: string): Puzzle;

  getNote(): string;
  setNote(value: string): Puzzle;

  getWidth(): number;
  setWidth(value: number): Puzzle;

  getHeight(): number;
  setHeight(value: number): Puzzle;

  getSquaresList(): Array<Puzzle.Cell>;
  setSquaresList(value: Array<Puzzle.Cell>): Puzzle;
  clearSquaresList(): Puzzle;
  addSquares(value?: Puzzle.Cell, index?: number): Puzzle.Cell;

  getAcrossCluesList(): Array<Puzzle.Clue>;
  setAcrossCluesList(value: Array<Puzzle.Clue>): Puzzle;
  clearAcrossCluesList(): Puzzle;
  addAcrossClues(value?: Puzzle.Clue, index?: number): Puzzle.Clue;

  getDownCluesList(): Array<Puzzle.Clue>;
  setDownCluesList(value: Array<Puzzle.Clue>): Puzzle;
  clearDownCluesList(): Puzzle;
  addDownClues(value?: Puzzle.Clue, index?: number): Puzzle.Clue;

  getMetadata(): Puzzle.Meta | undefined;
  setMetadata(value?: Puzzle.Meta): Puzzle;
  hasMetadata(): boolean;
  clearMetadata(): Puzzle;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Puzzle.AsObject;
  static toObject(includeInstance: boolean, msg: Puzzle): Puzzle.AsObject;
  static serializeBinaryToWriter(message: Puzzle, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Puzzle;
  static deserializeBinaryFromReader(message: Puzzle, reader: jspb.BinaryReader): Puzzle;
}

export namespace Puzzle {
  export type AsObject = {
    title: string,
    author: string,
    copyright: string,
    note: string,
    width: number,
    height: number,
    squaresList: Array<Puzzle.Cell.AsObject>,
    acrossCluesList: Array<Puzzle.Clue.AsObject>,
    downCluesList: Array<Puzzle.Clue.AsObject>,
    metadata?: Puzzle.Meta.AsObject,
  }

  export class Cell extends jspb.Message {
    getNumber(): number;
    setNumber(value: number): Cell;

    getBlack(): boolean;
    setBlack(value: boolean): Cell;

    getCircled(): boolean;
    setCircled(value: boolean): Cell;

    getFill(): string;
    setFill(value: string): Cell;

    getClueAcross(): number;
    setClueAcross(value: number): Cell;

    getClueDown(): number;
    setClueDown(value: number): Cell;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Cell.AsObject;
    static toObject(includeInstance: boolean, msg: Cell): Cell.AsObject;
    static serializeBinaryToWriter(message: Cell, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Cell;
    static deserializeBinaryFromReader(message: Cell, reader: jspb.BinaryReader): Cell;
  }

  export namespace Cell {
    export type AsObject = {
      number: number,
      black: boolean,
      circled: boolean,
      fill: string,
      clueAcross: number,
      clueDown: number,
    }
  }


  export class Clue extends jspb.Message {
    getNumber(): number;
    setNumber(value: number): Clue;

    getText(): string;
    setText(value: string): Clue;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Clue.AsObject;
    static toObject(includeInstance: boolean, msg: Clue): Clue.AsObject;
    static serializeBinaryToWriter(message: Clue, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Clue;
    static deserializeBinaryFromReader(message: Clue, reader: jspb.BinaryReader): Clue;
  }

  export namespace Clue {
    export type AsObject = {
      number: number,
      text: string,
    }
  }


  export class Meta extends jspb.Message {
    getCreated(): google_protobuf_timestamp_pb.Timestamp | undefined;
    setCreated(value?: google_protobuf_timestamp_pb.Timestamp): Meta;
    hasCreated(): boolean;
    clearCreated(): Meta;

    getSha256(): string;
    setSha256(value: string): Meta;

    getId(): string;
    setId(value: string): Meta;

    getDate(): string;
    setDate(value: string): Meta;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Meta.AsObject;
    static toObject(includeInstance: boolean, msg: Meta): Meta.AsObject;
    static serializeBinaryToWriter(message: Meta, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Meta;
    static deserializeBinaryFromReader(message: Meta, reader: jspb.BinaryReader): Meta;
  }

  export namespace Meta {
    export type AsObject = {
      created?: google_protobuf_timestamp_pb.Timestamp.AsObject,
      sha256: string,
      id: string,
      date: string,
    }
  }

}

export class PuzzleIndex extends jspb.Message {
  getId(): string;
  setId(value: string): PuzzleIndex;

  getTitle(): string;
  setTitle(value: string): PuzzleIndex;

  getDate(): string;
  setDate(value: string): PuzzleIndex;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PuzzleIndex.AsObject;
  static toObject(includeInstance: boolean, msg: PuzzleIndex): PuzzleIndex.AsObject;
  static serializeBinaryToWriter(message: PuzzleIndex, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PuzzleIndex;
  static deserializeBinaryFromReader(message: PuzzleIndex, reader: jspb.BinaryReader): PuzzleIndex;
}

export namespace PuzzleIndex {
  export type AsObject = {
    id: string,
    title: string,
    date: string,
  }
}

