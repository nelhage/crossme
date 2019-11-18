/**
 * @fileoverview
 * @enhanceable
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!

var jspb = require('google-protobuf');
var goog = jspb;
var global = Function('return this')();

var puzzle_pb = require('./puzzle_pb.js');
goog.exportSymbol('proto.crossme.GetPuzzleByIdArgs', null, global);
goog.exportSymbol('proto.crossme.GetPuzzleIndexArgs', null, global);
goog.exportSymbol('proto.crossme.GetPuzzleIndexResponse', null, global);
goog.exportSymbol('proto.crossme.GetPuzzleResponse', null, global);

/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.crossme.GetPuzzleIndexArgs = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.crossme.GetPuzzleIndexArgs, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  proto.crossme.GetPuzzleIndexArgs.displayName = 'proto.crossme.GetPuzzleIndexArgs';
}


if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.crossme.GetPuzzleIndexArgs.prototype.toObject = function(opt_includeInstance) {
  return proto.crossme.GetPuzzleIndexArgs.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.crossme.GetPuzzleIndexArgs} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.crossme.GetPuzzleIndexArgs.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.crossme.GetPuzzleIndexArgs}
 */
proto.crossme.GetPuzzleIndexArgs.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.crossme.GetPuzzleIndexArgs;
  return proto.crossme.GetPuzzleIndexArgs.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.crossme.GetPuzzleIndexArgs} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.crossme.GetPuzzleIndexArgs}
 */
proto.crossme.GetPuzzleIndexArgs.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.crossme.GetPuzzleIndexArgs.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.crossme.GetPuzzleIndexArgs.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.crossme.GetPuzzleIndexArgs} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.crossme.GetPuzzleIndexArgs.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};



/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.crossme.GetPuzzleIndexResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.crossme.GetPuzzleIndexResponse.repeatedFields_, null);
};
goog.inherits(proto.crossme.GetPuzzleIndexResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  proto.crossme.GetPuzzleIndexResponse.displayName = 'proto.crossme.GetPuzzleIndexResponse';
}
/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.crossme.GetPuzzleIndexResponse.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.crossme.GetPuzzleIndexResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.crossme.GetPuzzleIndexResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.crossme.GetPuzzleIndexResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.crossme.GetPuzzleIndexResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    puzzlesList: jspb.Message.toObjectList(msg.getPuzzlesList(),
    puzzle_pb.PuzzleIndex.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.crossme.GetPuzzleIndexResponse}
 */
proto.crossme.GetPuzzleIndexResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.crossme.GetPuzzleIndexResponse;
  return proto.crossme.GetPuzzleIndexResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.crossme.GetPuzzleIndexResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.crossme.GetPuzzleIndexResponse}
 */
proto.crossme.GetPuzzleIndexResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new puzzle_pb.PuzzleIndex;
      reader.readMessage(value,puzzle_pb.PuzzleIndex.deserializeBinaryFromReader);
      msg.addPuzzles(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.crossme.GetPuzzleIndexResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.crossme.GetPuzzleIndexResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.crossme.GetPuzzleIndexResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.crossme.GetPuzzleIndexResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPuzzlesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      puzzle_pb.PuzzleIndex.serializeBinaryToWriter
    );
  }
};


/**
 * repeated PuzzleIndex puzzles = 1;
 * @return {!Array<!proto.crossme.PuzzleIndex>}
 */
proto.crossme.GetPuzzleIndexResponse.prototype.getPuzzlesList = function() {
  return /** @type{!Array<!proto.crossme.PuzzleIndex>} */ (
    jspb.Message.getRepeatedWrapperField(this, puzzle_pb.PuzzleIndex, 1));
};


/** @param {!Array<!proto.crossme.PuzzleIndex>} value */
proto.crossme.GetPuzzleIndexResponse.prototype.setPuzzlesList = function(value) {
  jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.crossme.PuzzleIndex=} opt_value
 * @param {number=} opt_index
 * @return {!proto.crossme.PuzzleIndex}
 */
proto.crossme.GetPuzzleIndexResponse.prototype.addPuzzles = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.crossme.PuzzleIndex, opt_index);
};


proto.crossme.GetPuzzleIndexResponse.prototype.clearPuzzlesList = function() {
  this.setPuzzlesList([]);
};



/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.crossme.GetPuzzleByIdArgs = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.crossme.GetPuzzleByIdArgs, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  proto.crossme.GetPuzzleByIdArgs.displayName = 'proto.crossme.GetPuzzleByIdArgs';
}


if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.crossme.GetPuzzleByIdArgs.prototype.toObject = function(opt_includeInstance) {
  return proto.crossme.GetPuzzleByIdArgs.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.crossme.GetPuzzleByIdArgs} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.crossme.GetPuzzleByIdArgs.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.crossme.GetPuzzleByIdArgs}
 */
proto.crossme.GetPuzzleByIdArgs.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.crossme.GetPuzzleByIdArgs;
  return proto.crossme.GetPuzzleByIdArgs.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.crossme.GetPuzzleByIdArgs} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.crossme.GetPuzzleByIdArgs}
 */
proto.crossme.GetPuzzleByIdArgs.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.crossme.GetPuzzleByIdArgs.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.crossme.GetPuzzleByIdArgs.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.crossme.GetPuzzleByIdArgs} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.crossme.GetPuzzleByIdArgs.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.crossme.GetPuzzleByIdArgs.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/** @param {string} value */
proto.crossme.GetPuzzleByIdArgs.prototype.setId = function(value) {
  jspb.Message.setProto3StringField(this, 1, value);
};



/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.crossme.GetPuzzleResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.crossme.GetPuzzleResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  proto.crossme.GetPuzzleResponse.displayName = 'proto.crossme.GetPuzzleResponse';
}


if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.crossme.GetPuzzleResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.crossme.GetPuzzleResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.crossme.GetPuzzleResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.crossme.GetPuzzleResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    puzzle: (f = msg.getPuzzle()) && puzzle_pb.Puzzle.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.crossme.GetPuzzleResponse}
 */
proto.crossme.GetPuzzleResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.crossme.GetPuzzleResponse;
  return proto.crossme.GetPuzzleResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.crossme.GetPuzzleResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.crossme.GetPuzzleResponse}
 */
proto.crossme.GetPuzzleResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new puzzle_pb.Puzzle;
      reader.readMessage(value,puzzle_pb.Puzzle.deserializeBinaryFromReader);
      msg.setPuzzle(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.crossme.GetPuzzleResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.crossme.GetPuzzleResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.crossme.GetPuzzleResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.crossme.GetPuzzleResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPuzzle();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      puzzle_pb.Puzzle.serializeBinaryToWriter
    );
  }
};


/**
 * optional Puzzle puzzle = 1;
 * @return {?proto.crossme.Puzzle}
 */
proto.crossme.GetPuzzleResponse.prototype.getPuzzle = function() {
  return /** @type{?proto.crossme.Puzzle} */ (
    jspb.Message.getWrapperField(this, puzzle_pb.Puzzle, 1));
};


/** @param {?proto.crossme.Puzzle|undefined} value */
proto.crossme.GetPuzzleResponse.prototype.setPuzzle = function(value) {
  jspb.Message.setWrapperField(this, 1, value);
};


proto.crossme.GetPuzzleResponse.prototype.clearPuzzle = function() {
  this.setPuzzle(undefined);
};


/**
 * Returns whether this field is set.
 * @return {!boolean}
 */
proto.crossme.GetPuzzleResponse.prototype.hasPuzzle = function() {
  return jspb.Message.getField(this, 1) != null;
};


goog.object.extend(exports, proto.crossme);