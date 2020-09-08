/**
 * @fileoverview gRPC-Web generated client stub for crossme
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


/* eslint-disable */
// @ts-nocheck


import * as grpcWeb from 'grpc-web';

import * as crossme_pb from './crossme_pb';


export class CrossMeClient {
  client_: grpcWeb.AbstractClientBase;
  hostname_: string;
  credentials_: null | { [index: string]: string; };
  options_: null | { [index: string]: any; };

  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; }) {
    if (!options) options = {};
    if (!credentials) credentials = {};
    options['format'] = 'text';

    this.client_ = new grpcWeb.GrpcWebClientBase(options);
    this.hostname_ = hostname;
    this.credentials_ = credentials;
    this.options_ = options;
  }

  methodInfoGetPuzzleIndex = new grpcWeb.AbstractClientBase.MethodInfo(
    crossme_pb.GetPuzzleIndexResponse,
    (request: crossme_pb.GetPuzzleIndexArgs) => {
      return request.serializeBinary();
    },
    crossme_pb.GetPuzzleIndexResponse.deserializeBinary
  );

  getPuzzleIndex(
    request: crossme_pb.GetPuzzleIndexArgs,
    metadata: grpcWeb.Metadata | null): Promise<crossme_pb.GetPuzzleIndexResponse>;

  getPuzzleIndex(
    request: crossme_pb.GetPuzzleIndexArgs,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: crossme_pb.GetPuzzleIndexResponse) => void): grpcWeb.ClientReadableStream<crossme_pb.GetPuzzleIndexResponse>;

  getPuzzleIndex(
    request: crossme_pb.GetPuzzleIndexArgs,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: crossme_pb.GetPuzzleIndexResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/crossme.CrossMe/GetPuzzleIndex',
        request,
        metadata || {},
        this.methodInfoGetPuzzleIndex,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/crossme.CrossMe/GetPuzzleIndex',
    request,
    metadata || {},
    this.methodInfoGetPuzzleIndex);
  }

  methodInfoGetPuzzleById = new grpcWeb.AbstractClientBase.MethodInfo(
    crossme_pb.GetPuzzleResponse,
    (request: crossme_pb.GetPuzzleByIdArgs) => {
      return request.serializeBinary();
    },
    crossme_pb.GetPuzzleResponse.deserializeBinary
  );

  getPuzzleById(
    request: crossme_pb.GetPuzzleByIdArgs,
    metadata: grpcWeb.Metadata | null): Promise<crossme_pb.GetPuzzleResponse>;

  getPuzzleById(
    request: crossme_pb.GetPuzzleByIdArgs,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: crossme_pb.GetPuzzleResponse) => void): grpcWeb.ClientReadableStream<crossme_pb.GetPuzzleResponse>;

  getPuzzleById(
    request: crossme_pb.GetPuzzleByIdArgs,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: crossme_pb.GetPuzzleResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/crossme.CrossMe/GetPuzzleById',
        request,
        metadata || {},
        this.methodInfoGetPuzzleById,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/crossme.CrossMe/GetPuzzleById',
    request,
    metadata || {},
    this.methodInfoGetPuzzleById);
  }

  methodInfoNewGame = new grpcWeb.AbstractClientBase.MethodInfo(
    crossme_pb.NewGameResponse,
    (request: crossme_pb.NewGameArgs) => {
      return request.serializeBinary();
    },
    crossme_pb.NewGameResponse.deserializeBinary
  );

  newGame(
    request: crossme_pb.NewGameArgs,
    metadata: grpcWeb.Metadata | null): Promise<crossme_pb.NewGameResponse>;

  newGame(
    request: crossme_pb.NewGameArgs,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: crossme_pb.NewGameResponse) => void): grpcWeb.ClientReadableStream<crossme_pb.NewGameResponse>;

  newGame(
    request: crossme_pb.NewGameArgs,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: crossme_pb.NewGameResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/crossme.CrossMe/NewGame',
        request,
        metadata || {},
        this.methodInfoNewGame,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/crossme.CrossMe/NewGame',
    request,
    metadata || {},
    this.methodInfoNewGame);
  }

  methodInfoGetGameById = new grpcWeb.AbstractClientBase.MethodInfo(
    crossme_pb.GetGameResponse,
    (request: crossme_pb.GetGameByIdArgs) => {
      return request.serializeBinary();
    },
    crossme_pb.GetGameResponse.deserializeBinary
  );

  getGameById(
    request: crossme_pb.GetGameByIdArgs,
    metadata: grpcWeb.Metadata | null): Promise<crossme_pb.GetGameResponse>;

  getGameById(
    request: crossme_pb.GetGameByIdArgs,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: crossme_pb.GetGameResponse) => void): grpcWeb.ClientReadableStream<crossme_pb.GetGameResponse>;

  getGameById(
    request: crossme_pb.GetGameByIdArgs,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: crossme_pb.GetGameResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/crossme.CrossMe/GetGameById',
        request,
        metadata || {},
        this.methodInfoGetGameById,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/crossme.CrossMe/GetGameById',
    request,
    metadata || {},
    this.methodInfoGetGameById);
  }

  methodInfoUploadPuzzle = new grpcWeb.AbstractClientBase.MethodInfo(
    crossme_pb.UploadPuzzleResponse,
    (request: crossme_pb.UploadPuzzleArgs) => {
      return request.serializeBinary();
    },
    crossme_pb.UploadPuzzleResponse.deserializeBinary
  );

  uploadPuzzle(
    request: crossme_pb.UploadPuzzleArgs,
    metadata: grpcWeb.Metadata | null): Promise<crossme_pb.UploadPuzzleResponse>;

  uploadPuzzle(
    request: crossme_pb.UploadPuzzleArgs,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: crossme_pb.UploadPuzzleResponse) => void): grpcWeb.ClientReadableStream<crossme_pb.UploadPuzzleResponse>;

  uploadPuzzle(
    request: crossme_pb.UploadPuzzleArgs,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: crossme_pb.UploadPuzzleResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/crossme.CrossMe/UploadPuzzle',
        request,
        metadata || {},
        this.methodInfoUploadPuzzle,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/crossme.CrossMe/UploadPuzzle',
    request,
    metadata || {},
    this.methodInfoUploadPuzzle);
  }

  methodInfoUpdateFill = new grpcWeb.AbstractClientBase.MethodInfo(
    crossme_pb.UpdateFillResponse,
    (request: crossme_pb.UpdateFillArgs) => {
      return request.serializeBinary();
    },
    crossme_pb.UpdateFillResponse.deserializeBinary
  );

  updateFill(
    request: crossme_pb.UpdateFillArgs,
    metadata: grpcWeb.Metadata | null): Promise<crossme_pb.UpdateFillResponse>;

  updateFill(
    request: crossme_pb.UpdateFillArgs,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: crossme_pb.UpdateFillResponse) => void): grpcWeb.ClientReadableStream<crossme_pb.UpdateFillResponse>;

  updateFill(
    request: crossme_pb.UpdateFillArgs,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: crossme_pb.UpdateFillResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/crossme.CrossMe/UpdateFill',
        request,
        metadata || {},
        this.methodInfoUpdateFill,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/crossme.CrossMe/UpdateFill',
    request,
    metadata || {},
    this.methodInfoUpdateFill);
  }

  methodInfoSubscribe = new grpcWeb.AbstractClientBase.MethodInfo(
    crossme_pb.SubscribeEvent,
    (request: crossme_pb.SubscribeArgs) => {
      return request.serializeBinary();
    },
    crossme_pb.SubscribeEvent.deserializeBinary
  );

  subscribe(
    request: crossme_pb.SubscribeArgs,
    metadata?: grpcWeb.Metadata) {
    return this.client_.serverStreaming(
      this.hostname_ +
        '/crossme.CrossMe/Subscribe',
      request,
      metadata || {},
      this.methodInfoSubscribe);
  }

}

