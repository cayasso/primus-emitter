var emitter = require('../../')
  , Primus = require('primus')
  , http = require('http')
  , fs = require('fs');

var server = http.createServer(function server(req, res) {
  res.setHeader('Content-Type', 'text/html');
  fs.createReadStream(__dirname + '/index.html').pipe(res);
});

// Primus server.
var primus = new Primus(server);

// Add emitter functionality to primus
primus.plugin('emitter', emitter);

// Listen for new connections
primus.on('connection', function connection(spark) {
  console.log('Incoming connection', spark.id);

  spark.send('news', '[SERVER] => Hi from server', function (msg) {
    console.log(msg);
  });

  spark.on('news', function (msg, fn) {
    console.log(msg);
    fn('[SERVER ACK] => Message received');
  });

});

// Start server listening
server.listen(process.env.PORT || 8080, function(){
  var bound = server.address();
  console.log('\033[96mlistening on %s:%d \033[39m', bound.address, bound.port);
});
