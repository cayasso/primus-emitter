(function (Primus) {

var define = define || null;
var require = require || null;
// Super simple require system 
(function () {

// Store our repository in private variables in this closure.
var defs = {},
    modules = {};

// When the user defines a module's setup function, store it here.
define = function define(name, fn) {
  defs[name] = fn;
}

var realRequire = typeof require !== "undefined" && require;
// The first time a module is used, it's description is executed and cached.
require = function require(name) {
  if (modules.hasOwnProperty(name)) return modules[name];
  if (defs.hasOwnProperty(name)) {
    var exports = modules[name] = {};
    var module = {exports:exports};
    var fn = defs[name];
    fn(module, exports);
    return modules[name] = module.exports;
  }
  if (realRequire) {
    return realRequire(name);
  }
  throw new Error("Can't find module " + name);
}

}());


define('./emitter', function (module, exports) {

/**
 * Event packets.
 */

var packets = {
  EVENT:  0,
  ACK:    1
};

/**
 * Blacklisted events.
 */

var events = [
  'end',
  'open',
  'data',
  'error',
  'online',
  'offline',
  'timeout',
  'initialised',
  'reconnect',
  'reconnecting',
  'connection',
  'disconnection'
];

// shortcut to slice
var slice = [].slice;

// events regex
var evRE = new RegExp('^(' + events.join('|') + ')$');

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(conn) {
  if (!(this instanceof Emitter)) return new Emitter(conn);
  this.ids = 1;
  this.acks = {};
  this.conn = conn;
  if (this.conn) this.bind();
}

/**
 * Bind `Emitter` events.
 *
 * @return {Emitter} self
 * @api private
 */

Emitter.prototype.bind = function () {
  var em = this;
  this.conn.on('data', function (data) {
    em.ondata.call(em, data);
  });
  return this;
};

/**
 * Called with incoming transport data.
 *
 * @param {Object} packet
 * @return {Emitter} self
 * @api private
 */

Emitter.prototype.ondata = function (packet) {
  switch (packet.type) {
    case packets.EVENT:
      this.onevent(packet);
      break;
    case packets.ACK:
      this.onack(packet);
      break;
  }
};

/**
 * Emits a message.
 *
 * @return {Socket} self
 * @api public
 */

Emitter.prototype.emit = function (ev) {
  if (this.isReservedEvent(ev)) {
    this.conn.__emit__.apply(this.conn, arguments);
  } else {
    var args = slice.call(arguments);
    this.conn.write(this.packet(args));
  }
  return this;
};

/**
 * Prepare packet for emitting.
 *
 * @param {Array} arguments
 * @return {Object} packet
 * @api private
 */

Emitter.prototype.packet = function (args) {
  var packet = { type: packets.EVENT, data: args };
  // access last argument to see if it's an ACK callback
  if ('function' == typeof args[args.length - 1]) {
    var id = this.ids++;
    if (this.acks) {
      this.acks[id] = args.pop();
      packet.id = id;
    }
  }
  return packet;
};

/**
 * Check if the event is not a primus reserved one.
 *
 * @param {String} event
 * @return {Boolean}
 * @api private
 */

Emitter.prototype.isReservedEvent = function (ev) {
  return (/^(incoming::|outgoing::)/.test(ev) || evRE.test(ev));
},

/**
 * Called upon event packet.
 *
 * @param {Object} packet object
 * @api private
 */

Emitter.prototype.onevent = function (packet) {
  var args = packet.data || [];
  if (null != packet.id) {
    args.push(this.ack(packet.id));
  }
  this.conn.__emit__.apply(this.conn, args);
  return this;
};

/**
 * Produces an ack callback to emit with an event.
 *
 * @param {Number} packet id
 * @return {Function}
 * @api private
 */

Emitter.prototype.ack = function (id) {
  var conn = this.conn;
  var sent = false;
  return function(){
    // prevent double callbacks
    if (sent) return;
    conn.write({
      id: id,
      type: packets.ACK,
      data: slice.call(arguments)
    });
  };
};

/**
 * Called upon ack packet.
 *
 * @return {Emitter} self
 * @api private
 */

Emitter.prototype.onack = function (packet) {
  var ack = this.acks[packet.id];
  if ('function' == typeof ack) {
    ack.apply(this, packet.data);
    delete this.acks[packet.id];
  } else {
    //console.log('bad ack %s', packet.id);
  }
  return this;
};

// Expose packets & blacklist
Emitter.packets = packets;
Emitter.blacklist = events;

});


define('primus-emitter', function (module, exports) {

/**
 * Module dependencies.
 */

var Emitter = require('./emitter');

/**
 * Expose `PrimusEmitter`.
 */

module.exports = PrimusEmitter;

/**
 * This method initialize PrimusEmitter on primus instance.
 *
 * @param {Primus} primus Primus instance.
 * @param {Object} options The options.
 * @api public
 */

function PrimusEmitter (primus, options) {
  options = options || {};

  // Extending primus.Spark
  PrimusEmitter.Spark(primus.Spark || primus);
  return this;
}

/**
 * Extend a Spark to add Rooms capabilities.
 * 
 * @return {Spark} It returns a primus.Spark
 * @api public
 */

PrimusEmitter.Spark = function (Spark) {

  // return if this already was extended with Emitter;
  if (Spark.prototype.__Emitter__) return Spark;

  /**
   * `Primus#emit` reference.
   */

  var emit = Spark.prototype.emit;

  /**
   * `Primus#initialise` reference.
   */

  var init = Spark.prototype.initialise;

  /**
   * Adding reference to Emitter.
   */

  Spark.prototype.__Emitter__ = Emitter;

  /**
   * Initialise the Primus and setup all
   * parsers and internal listeners.
   *
   * @api private
   */

  Spark.prototype.initialise = function () {
    this.__emit__ = emit;
    this.emitter = new Emitter(this);
    init.apply(this, arguments);
    return this;
  };

  /**
   * Emits to this Spark.
   *
   * @return {Socket} self
   * @api public
   */

  Spark.prototype.emit = function (ev) {   
    // ignore newListener event to avoid this error in node 0.8
    // https://github.com/cayasso/primus-emitter/issues/3
    if ('newListener' === ev) return this;
    this.emitter.emit.apply(this.emitter, arguments);
    return this;
  };

  return Spark;
};

// Expose Emitter
PrimusEmitter.Emitter = Emitter;
});

require('primus-emitter')(Primus);

})(Primus);
