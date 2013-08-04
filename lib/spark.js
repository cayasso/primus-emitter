// We need to use this to export our module and to make
// it compatible with browser, I know, I know... this is only 
// for now, I will find a better way.

(function (name, context, definition) {
    if ('undefined' !== typeof module && module.exports) {
      module.exports = definition();
    } else if ('function' === typeof define && define.amd) {
      define(definition);
    } else {
      context[name] = definition();
    }
})("Primus", this, function PRIMUSIO() {

  function PrimusIO(Spark) {

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
      'reconnect',
      'reconnecting',
      'connection',
      'disconnection'
    ];

    // events regex
    var evRE = new RegExp('^(' + events.join('|') + ')$');

    // slice shortcut
    var slice = [].slice;

    /**
     * `Primus#emit` reference.
     */

    var emit = Spark.prototype.emit;

    /**
     * `Primus#initialise` reference.
     */

    var init = Spark.prototype.initialise;

    /**
     * Initialise the Primus and setup all
     * parsers and internal listeners.
     *
     * @api private
     */

    Spark.prototype.initialise = function () {
      init.apply(this, arguments);
      var spark = this;
      this.ids = 1;
      this.acks = {};
      spark.on('data', function (data) {
        spark.ondata.call(spark, data);
      });

      return this;
    };

    /**
     * Called with incoming transport data.
     *
     * @api private
     */

    Spark.prototype.ondata = function (packet) {

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
     * Emits to this Spark.
     *
     * @return {Socket} self
     * @api public
     */

    Spark.prototype.emit = function (ev) {
      if (this.isReservedEvent(ev)) {
        emit.apply(this, arguments);
      } else {
        var args = slice.call(arguments);
        this.write(this.packet(args));
      }
      return this;
    };

    /**
     * Prepare packet for emitting.
     * @param {Array} arguments
     * @return {Object} packet
     * @api private
     */

    Spark.prototype.packet = function (args) {
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
     * @api private
     */

    Spark.prototype.isReservedEvent = function (ev) {
      return (/^(incoming::|outgoing::)/.test(ev) || evRE.test(ev));
    },

    /**
     * Called upon event packet.
     *
     * @param {Object} packet object
     * @api private
     */

    Spark.prototype.onevent = function (packet) {
      var args = packet.data || [];
      if (null != packet.id) {
        args.push(this.ack(packet.id));
      }
      emit.apply(this, args);
    };

    /**
     * Produces an ack callback to emit with an event.
     *
     * @param {Number} packet id
     * @api private
     */

    Spark.prototype.ack = function (id) {
      var spark = this;
      var sent = false;
      return function(){
        // prevent double callbacks
        if (sent) return;
        var args = slice.call(arguments);
        spark.write({
          id: id,
          type: packets.ACK,
          data: args
        });
      };
    };

    /**
     * Called upon ack packet.
     *
     * @api private
     */

    Spark.prototype.onack = function (packet) {
      var ack = this.acks[packet.id];
      if ('function' == typeof ack) {
        ack.apply(this, packet.data);
        delete this.acks[packet.id];
      } else {
        //console.log('bad ack %s', packet.id);
      }
    };

    // Expose packets & blacklist
    Spark.packets = packets;
    Spark.blacklist = events;

    return Spark;
  }

  return this.Primus ? PrimusIO(Primus) : PrimusIO;

});

// [*] End of lib/primus.js