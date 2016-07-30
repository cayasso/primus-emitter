'use strict';

const Primus = require('primus');
const http = require('http');

const emitter = require('../../');

const server = http.createServer();
const primus = new Primus(server);

// Add emitter plugin
primus.plugin('emitter', emitter);

primus.on('connection', (spark) => {
  spark.on('news', (data, fn) => {
    console.log(data);
    fn('ok');
  });

  setInterval(() => spark.send('news', 'foo'), 2500);
});

server.listen(() => {
  const port = server.address().port;
  console.log('listening on *:%d', port);

  const socket = new primus.Socket(`http://localhost:${port}`);

  setInterval(() => {
    socket.send('news', { 'hello': 'world' }, (data) => {
      console.log('client ack %s', data);
    });
  }, 3500);

  socket.on('news', (data) => console.log(data));
});
