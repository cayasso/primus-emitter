/**
 * Module dependencies.
 */

var fs = require('fs');
var file = __dirname + '/primus-emitter.js';
var library = fs.readFileSync(file, 'utf-8');
var Emitter = require('./lib');

/**
 * Exporting modules.
 */

exports.server = function PrimusEmitter(primus) {
  primus.$ = primus.$ || {};
  primus.$.Emitter = Emitter;
  Emitter(primus.Spark);
  process.nextTick(function () {
    if (primus.$.Multiplex) {
      Emitter(primus.$.Multiplex.Channel.Spark);
    }
  });
};

exports.library = library;
exports.client = function(){};
exports.PrimusEmitter = Emitter;