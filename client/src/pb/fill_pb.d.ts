import * as jspb from "google-protobuf"

export class Fill extends jspb.Message {
  getPuzzleId(): string;
  setPuzzleId(value: string): void;

  getComplete(): boolean;
  setComplete(value: boolean): void;

  getClock(): number;
  setClock(value: number): void;

  getNodesList(): Array<string>;
  setNodesList(value: Array<string>): void;
  clearNodesList(): void;
  addNodes(value: string, index?: number): void;

  getCellsList(): Array<Fill.Cell>;
  setCellsList(value: Array<Fill.Cell>): void;
  clearCellsList(): void;
  addCells(value?: Fill.Cell, index?: number): Fill.Cell;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Fill.AsObject;
  static toObject(includeInstance: boolean, msg: Fill): Fill.AsObject;
  static serializeBinaryToWriter(message: Fill, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Fill;
  static deserializeBinaryFromReader(message: Fill, reader: jspb.BinaryReader): Fill;
}

export namespace Fill {
  export type AsObject = {
    puzzleId: string,
    complete: boolean,
    clock: number,
    nodesList: Array<string>,
    cellsList: Array<Fill.Cell.AsObject>,
  }

  export class Cell extends jspb.Message {
    getIndex(): number;
    setIndex(value: number): void;

    getClock(): number;
    setClock(value: number): void;

    getOwner(): number;
    setOwner(value: number): void;

    getFill(): string;
    setFill(value: string): void;

    getFlags(): number;
    setFlags(value: number): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Cell.AsObject;
    static toObject(includeInstance: boolean, msg: Cell): Cell.AsObject;
    static serializeBinaryToWriter(message: Cell, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Cell;
    static deserializeBinaryFromReader(message: Cell, reader: jspb.BinaryReader): Cell;
  }

  export namespace Cell {
    export type AsObject = {
      index: number,
      clock: number,
      owner: number,
      fill: string,
      flags: number,
    }
  }


  export enum Flags { 
    NONE = 0,
    CHECKED_RIGHT = 1,
    CHECKED_WRONG = 2,
    PENCIL = 4,
    DID_CHECK = 8,
    DID_REVEAL = 16,
  }
}

