'use strict';

const Primus = require('primus');
const http = require('http');
const fs = require('fs');

const emitter = require('../../');

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  fs.createReadStream(__dirname + '/index.html').pipe(res);
});

const primus = new Primus(server);

// Add emitter plugin
primus.plugin('emitter', emitter);

primus.on('connection', (spark) => {
  spark.send('news', 'Hi client', (msg) => console.log('server ack %s', msg));
  spark.on('news', (msg, fn) => {
    console.log(msg);
    fn('ok');
  });
});

server.listen(() => console.log('listening on *:%d', server.address().port));
