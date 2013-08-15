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

  Spark.prototype.__emit__ = Spark.prototype.emit;

  /**
   * `Primus#initialise` reference.
   */

  Spark.prototype.__init__ = Spark.prototype.initialise;

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
    this._emitter = new Emitter(this);
    this.__init__.apply(this, arguments);
    return this;
  };

  /**
   * Emits to this Spark.
   *
   * @return {Socket} self
   * @api public
   */

  Spark.prototype.emit = function (ev) {
    this._emitter.emit.apply(this._emitter, arguments);
    return this;
  };

  return Spark;
}

// Expose Emitter
PrimusEmitter.Emitter = Emitter;