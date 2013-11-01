'use strict';

/**
 * Module dependencies.
 */

var spark = require('./spark')
  , emitter = require('./emitter')
  , Emitter = emitter()
  , noop = function noop(){};

/**
 * Export `PrimusEmitter`.
 */

module.exports = PrimusEmitter;

/**
 * Constructor.
 *
 * @param {Primus} primus The primus instance.
 * @api public
 */

function PrimusEmitter(primus) {
  primus.$ = primus.$ || {};
  primus.$.PrimusEmitter = PrimusEmitter;
  return spark(primus.Spark, Emitter);
}

/**
 * Source code for plugin library.
 *
 * @type {String}
 * @api public
 */

PrimusEmitter.library = [
  ';(function (Primus, undefined) {',
  '"use strict";',
    spark.toString(),
    emitter.toString(),
  'if (undefined !== Primus)',
  'spark(Primus, emitter());',
  '})(Primus);'
].join('\n');

/**
 * Expose server.
 */

PrimusEmitter.server = PrimusEmitter;

/**
 * Expose client.
 */

PrimusEmitter.client = noop;

/**
 * Expose `spark` extend method.
 */

PrimusEmitter.spark = spark;

/**
 * Expose `Emitter`.
 */

PrimusEmitter.Emitter = Emitter;