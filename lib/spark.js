module.exports = function spark(Spark, Emitter, test) {

  'use strict';

  /**
   * `Primus#initialise` reference.
   */

  var initialise = Spark.prototype.initialise;

  /**
   * Initialise the Primus and setup all
   * parsers and internal listeners.
   *
   * @api private
   */

  Spark.prototype.initialise = function init() {
    if (!this.emitter) this.emitter = new Emitter(this);
    if (!this.__initialise) initialise.apply(this, arguments);
  };

  /**
   * Emits to this Spark.
   *
   * @return {Socket} self
   * @api public
   */

  Spark.prototype.send = function send(ev) {
    // ignore newListener event to avoid this error in node 0.8
    // https://github.com/cayasso/primus-emitter/issues/3
    if ('newListener' === ev) return this;
    this.emitter.send.apply(this.emitter, arguments);
    return this;
  };

};