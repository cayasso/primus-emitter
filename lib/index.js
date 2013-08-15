/**
 * Module dependencies.
 */

var Emitter = require('./emitter');

/**
 * Expose `PrimusEmitter`.
 */

module.exports = PrimusEmitter;

function PrimusEmitter(Spark) {

  //Spark.Emitter = Emitter;

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
    this.emitter.emit.apply(this.emitter, arguments);
    return this;
  };

  return Spark;
}

// Expose Emitter
PrimusEmitter.Emitter = Emitter;