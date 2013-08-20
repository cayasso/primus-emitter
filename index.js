/**
 * Module dependencies.
 */

var fs = require('fs');
var file = __dirname + '/primus-emitter.js';
var library = fs.readFileSync(file, 'utf-8');
var PrimusEmitter = require('./lib');

/**
 * Exporting modules.
 */

exports.server = function server(primus, options) {
  primus.$ = primus.$ || {};
  primus.$.PrimusEmitter = PrimusEmitter;
  PrimusEmitter(primus, options);
  process.nextTick(function () {
    if (primus.$.Multiplex) {
      PrimusEmitter.Spark(primus.$.Multiplex.Spark);
    }
  });
};

exports.library = library;
exports.client = function(){};
exports.Emitter = PrimusEmitter.Emitter;
exports.PrimusEmitter = PrimusEmitter;