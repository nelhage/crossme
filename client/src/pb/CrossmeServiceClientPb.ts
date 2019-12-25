/**
 * @fileoverview gRPC-Web generated client stub for crossme
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


import * as grpcWeb from 'grpc-web';

import * as puzzle_pb from './puzzle_pb';
import * as fill_pb from './fill_pb';

import {
  GetPuzzleByIdArgs,
  GetPuzzleIndexArgs,
  GetPuzzleIndexResponse,
  GetPuzzleResponse,
  InteractEvent,
  InteractResponse,
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

}

