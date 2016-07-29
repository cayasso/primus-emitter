var emitter = require('../../');
var Primus = require('primus');
var http = require('http');
var server = http.createServer();

// THE SERVER
var primus = new Primus(server);

// Add emitter functionality to primus
primus.plugin('emitter', emitter);

// Server stuff
primus.on('connection', function(spark){

  // testing regular
  spark.on('news', function(data, fn){
    console.log(arguments);
    fn(null, 'ok');
  });

  setInterval(function(){
    spark.send('news', 'data');
  }, 2500);

});


// THE CLIENT
function setClient() {

  var Socket = primus.Socket;
  var socket = new Socket('http://localhost:8080');

  setInterval(function(){
    socket.send('news', { 'hello': 'world' }, function (data) {
      console.log('sent', arguments);
    });
  }, 3500);

  // on data received
  socket.on('news', function (data) {
    console.log('MSG:', data);
  });
}

// Set first client
setTimeout(function () {
  setClient();
}, 0);

server.listen(process.env.PORT || 8080, function(){
  var bound = server.address();
  console.log('\033[96mlistening on %s:%d \033[39m', bound.address, bound.port);
});
