module.exports = function emitter() {

  'use strict';

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
    'close',
    'online',
    'offline',
    'timeout',
    'reconnect',
    'reconnecting'
  ];

  // events regex
  var evRE = new RegExp('^(' + events.join('|') + ')$');

  // shortcut to slice
  var slice = [].slice;

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
   * Send a message to client.
   *
   * @return {Emitter} self
   * @api public
   */

  Emitter.prototype.send = function (ev) {
    if (evRE.test(ev)) return this;
    var args = slice.call(arguments);
    this.conn.write(this.packet(args));
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
    this.conn.emit.apply(this.conn, args);
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
      console.log('bad ack %s', packet.id);
    }
    return this;
  };

  // Expose packets & blacklist
  Emitter.packets = packets;
  Emitter.reservedEvents = events;
  
  return Emitter;

};