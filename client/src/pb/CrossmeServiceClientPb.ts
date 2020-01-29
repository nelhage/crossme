/**
 * @fileoverview gRPC-Web generated client stub for crossme
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


import * as grpcWeb from 'grpc-web';

import * as puzzle_pb from './puzzle_pb';
import * as fill_pb from './fill_pb';
import * as game_pb from './game_pb';

import {
  GetGameByIdArgs,
  GetGameResponse,
  GetPuzzleByIdArgs,
  GetPuzzleIndexArgs,
  GetPuzzleIndexResponse,
  GetPuzzleResponse,
  NewGameArgs,
  NewGameResponse,
  SubscribeArgs,
  SubscribeEvent,
  UpdateFillArgs,
  UpdateFillResponse,
  UploadPuzzleArgs,
  UploadPuzzleResponse} from './crossme_pb';

export class CrossMeClient {
  client_: grpcWeb.AbstractClientBase;
  hostname_: string;
  credentials_: null | { [index: string]: string; };
  options_: null | { [index: string]: string; };

  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; }) {
    if (!options) options = {};
    if (!credentials) credentials = {};
    options['format'] = 'text';

    this.client_ = new grpcWeb.GrpcWebClientBase(options);
    this.hostname_ = hostname;
    this.credentials_ = credentials;
    this.options_ = options;
  }

  methodInfoGetPuzzleIndex = new grpcWeb.AbstractClientBase.MethodInfo(
    GetPuzzleIndexResponse,
    (request: GetPuzzleIndexArgs) => {
      return request.serializeBinary();
    },
    GetPuzzleIndexResponse.deserializeBinary
  );

  getPuzzleIndex(
    request: GetPuzzleIndexArgs,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: GetPuzzleIndexResponse) => void) {
    return this.client_.rpcCall(
      this.hostname_ +
        '/crossme.CrossMe/GetPuzzleIndex',
      request,
      metadata || {},
      this.methodInfoGetPuzzleIndex,
      callback);
  }

  methodInfoGetPuzzleById = new grpcWeb.AbstractClientBase.MethodInfo(
    GetPuzzleResponse,
    (request: GetPuzzleByIdArgs) => {
      return request.serializeBinary();
    },
    GetPuzzleResponse.deserializeBinary
  );

  getPuzzleById(
    request: GetPuzzleByIdArgs,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: GetPuzzleResponse) => void) {
    return this.client_.rpcCall(
      this.hostname_ +
        '/crossme.CrossMe/GetPuzzleById',
      request,
      metadata || {},
      this.methodInfoGetPuzzleById,
      callback);
  }

  methodInfoNewGame = new grpcWeb.AbstractClientBase.MethodInfo(
    NewGameResponse,
    (request: NewGameArgs) => {
      return request.serializeBinary();
    },
    NewGameResponse.deserializeBinary
  );

  newGame(
    request: NewGameArgs,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: NewGameResponse) => void) {
    return this.client_.rpcCall(
      this.hostname_ +
        '/crossme.CrossMe/NewGame',
      request,
      metadata || {},
      this.methodInfoNewGame,
      callback);
  }

  methodInfoGetGameById = new grpcWeb.AbstractClientBase.MethodInfo(
    GetGameResponse,
    (request: GetGameByIdArgs) => {
      return request.serializeBinary();
    },
    GetGameResponse.deserializeBinary
  );

  getGameById(
    request: GetGameByIdArgs,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: GetGameResponse) => void) {
    return this.client_.rpcCall(
      this.hostname_ +
        '/crossme.CrossMe/GetGameById',
      request,
      metadata || {},
      this.methodInfoGetGameById,
      callback);
  }

  methodInfoUploadPuzzle = new grpcWeb.AbstractClientBase.MethodInfo(
    UploadPuzzleResponse,
    (request: UploadPuzzleArgs) => {
      return request.serializeBinary();
    },
    UploadPuzzleResponse.deserializeBinary
  );

  uploadPuzzle(
    request: UploadPuzzleArgs,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: UploadPuzzleResponse) => void) {
    return this.client_.rpcCall(
      this.hostname_ +
        '/crossme.CrossMe/UploadPuzzle',
      request,
      metadata || {},
      this.methodInfoUploadPuzzle,
      callback);
  }

  methodInfoUpdateFill = new grpcWeb.AbstractClientBase.MethodInfo(
    UpdateFillResponse,
    (request: UpdateFillArgs) => {
      return request.serializeBinary();
    },
    UpdateFillResponse.deserializeBinary
  );

  updateFill(
    request: UpdateFillArgs,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: UpdateFillResponse) => void) {
    return this.client_.rpcCall(
      this.hostname_ +
        '/crossme.CrossMe/UpdateFill',
      request,
      metadata || {},
      this.methodInfoUpdateFill,
      callback);
  }

  methodInfoSubscribe = new grpcWeb.AbstractClientBase.MethodInfo(
    SubscribeEvent,
    (request: SubscribeArgs) => {
      return request.serializeBinary();
    },
    SubscribeEvent.deserializeBinary
  );

  subscribe(
    request: SubscribeArgs,
    metadata?: grpcWeb.Metadata) {
    return this.client_.serverStreaming(
      this.hostname_ +
        '/crossme.CrossMe/Subscribe',
      request,
      metadata || {},
      this.methodInfoSubscribe);
  }

}

