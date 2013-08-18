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
    if (primus.multiplex) {
      Emitter(primus.multiplex.Spark);
    }
  });
  Emitter(primus.Spark);
};

exports.library = library;
exports.client = function(){};
exports.PrimusEmitter = Emitter;