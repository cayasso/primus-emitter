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

exports.server = function(primus) {
  process.nextTick(function () {
    if (primus.ark.multiplex && primus.ark.multiplex.server) {
      Emitter(primus.ark.multiplex.server.Spark);
    }
  });
  Emitter(primus.Spark);
};

exports.client = function(){};
exports.library = library;
exports.PrimusEmitter = Emitter;