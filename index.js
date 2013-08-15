/**
 * Module dependencies.
 */

var fs = require('fs');
var file = __dirname + '/dist/primus-emitter.js';
var library = fs.readFileSync(file, 'utf-8');
var PrimusEmitter = require('./lib');


/**
 * Exporting modules.
 */

exports.server = function(primus) {

  if (primus.ark.multiplex) {
    console.log('has multiplex');
    console.log(primus.ark.multiplex.server.Spark);
    PrimusEmitter(primus.ark.multiplex.server.Spark);
  }

  PrimusEmitter(primus.Spark);
};

exports.client = function(){};
exports.library = library;