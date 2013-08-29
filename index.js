/**
 * Module dependencies.
 */

var exp = 'PrimusEmitter = exp;';
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
};

exports.client = function(){};
exports.library = library.replace(exp, 'exp(Primus);');
exports.Emitter = PrimusEmitter.Emitter;
exports.PrimusEmitter = PrimusEmitter;