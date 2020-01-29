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

var fill_pb = require('./fill_pb.js');
var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js');
goog.exportSymbol('proto.crossme.Game', null, global);

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
proto.crossme.Game = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.crossme.Game, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  proto.crossme.Game.displayName = 'proto.crossme.Game';
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
proto.crossme.Game.prototype.toObject = function(opt_includeInstance) {
  return proto.crossme.Game.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.crossme.Game} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.crossme.Game.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    puzzleId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    fill: (f = msg.getFill()) && fill_pb.Fill.toObject(includeInstance, f),
    created: (f = msg.getCreated()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f)
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
 * @return {!proto.crossme.Game}
 */
proto.crossme.Game.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.crossme.Game;
  return proto.crossme.Game.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.crossme.Game} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.crossme.Game}
 */
proto.crossme.Game.deserializeBinaryFromReader = function(msg, reader) {
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
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setPuzzleId(value);
      break;
    case 3:
      var value = new fill_pb.Fill;
      reader.readMessage(value,fill_pb.Fill.deserializeBinaryFromReader);
      msg.setFill(value);
      break;
    case 4:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setCreated(value);
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
proto.crossme.Game.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.crossme.Game.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.crossme.Game} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.crossme.Game.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getPuzzleId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getFill();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      fill_pb.Fill.serializeBinaryToWriter
    );
  }
  f = message.getCreated();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.crossme.Game.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/** @param {string} value */
proto.crossme.Game.prototype.setId = function(value) {
  jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string puzzle_id = 2;
 * @return {string}
 */
proto.crossme.Game.prototype.getPuzzleId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/** @param {string} value */
proto.crossme.Game.prototype.setPuzzleId = function(value) {
  jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional Fill fill = 3;
 * @return {?proto.crossme.Fill}
 */
proto.crossme.Game.prototype.getFill = function() {
  return /** @type{?proto.crossme.Fill} */ (
    jspb.Message.getWrapperField(this, fill_pb.Fill, 3));
};


/** @param {?proto.crossme.Fill|undefined} value */
proto.crossme.Game.prototype.setFill = function(value) {
  jspb.Message.setWrapperField(this, 3, value);
};


proto.crossme.Game.prototype.clearFill = function() {
  this.setFill(undefined);
};


/**
 * Returns whether this field is set.
 * @return {!boolean}
 */
proto.crossme.Game.prototype.hasFill = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional google.protobuf.Timestamp created = 4;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.crossme.Game.prototype.getCreated = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 4));
};


/** @param {?proto.google.protobuf.Timestamp|undefined} value */
proto.crossme.Game.prototype.setCreated = function(value) {
  jspb.Message.setWrapperField(this, 4, value);
};


proto.crossme.Game.prototype.clearCreated = function() {
  this.setCreated(undefined);
};


/**
 * Returns whether this field is set.
 * @return {!boolean}
 */
proto.crossme.Game.prototype.hasCreated = function() {
  return jspb.Message.getField(this, 4) != null;
};


goog.object.extend(exports, proto.crossme);
