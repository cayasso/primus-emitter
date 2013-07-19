'use strict';
/**
 * Module dependencies.
 */

var fs = require('fs')
  , Spark = require('./spark');

/**
 * Exports module.
 */

module.exports = {

  server: function server (primus) {
    // Lets extend Spark to add rooms.
    Spark(primus.Spark);
  },

  client: function client (primus) {
    // for some reason this deinition is
    // needed for the client to work
  },

  library: fs.readFileSync(__dirname + '/spark.js', 'utf-8')

};
