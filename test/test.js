var Primus = require('primus');
var emitter = require('../');
var http = require('http').Server;
var expect = require('expect.js');
var opts = { transformer: 'websockets', parser: 'JSON' };


// creates the client
function client(srv, primus, port){
  var addr = srv.address();
  var url = 'http://' + addr.address + ':' + (port || addr.port);
  return new primus.Socket(url);
}

// creates the server
function server(srv, opts) {
  // use rooms plugin
  return Primus(srv, opts).use('emitter', emitter);
}

describe('primus-emitter', function () {

  it('should have required methods', function(done){
    var srv = http();
    var primus = server(srv, opts);
    //primus.save('test.js');
    srv.listen(function(){
      primus.on('connection', function (spark) {
        expect(spark.emit).to.be.a('function');
        expect(spark.on).to.be.a('function');
        done();
      });
      client(srv, primus);
    });
  });

  it('should emit event from server', function(done){
    var srv = http();
    var primus = server(srv, opts);
    srv.listen(function(){
      primus.on('connection', function(spark){
        spark.emit('news', 'data');
      });
      var cl = client(srv, primus);
      cl.on('news', function (data) {
        expect(data).to.be('data');
        done();
      });
    });
  });

  it('should emit object from server', function(done){
    var srv = http();
    var primus = server(srv, opts);
    var msg = { hi: 'hello', num: 123456 };
    srv.listen(function(){
      primus.on('connection', function(spark){
        spark.emit('news', msg);
      });
      var cl = client(srv, primus);
      cl.on('news', function (data) {
        expect(data).to.be.eql(msg);
        done();
      });
    });
  });

  it('should support ack from server', function(done){
    var srv = http();
    var primus = server(srv, opts);
    var msg = { hi: 'hello', num: 123456 };
    srv.listen(function(){
      primus.on('connection', function(spark){
        spark.emit('news', msg, function (err, res) {
          expect(res).to.be('received');
          expect(err).to.be.eql(null);
          done();
        });
      });
      var cl = client(srv, primus);
      cl.on('news', function (data, fn) {
        fn(null, 'received');
      });
    });
  });

  it('should emit event from client', function(done){
    var srv = http();
    var primus = server(srv, opts);
    srv.listen(function(){
      primus.on('connection', function(spark){
        spark.on('news', function (data) {
          expect(data).to.be('data');
          done();
        });
      });
      var cl = client(srv, primus);
      cl.emit('news', 'data');
    });
  });

  it('should emit object from client', function(done){
    var srv = http();
    var primus = server(srv, opts);
    var msg = { hi: 'hello', num: 123456 };
    srv.listen(function(){
      primus.on('connection', function(spark){
        spark.on('news', function (data) {
          expect(data).to.be.eql(msg);
          done();
        });
      });
      var cl = client(srv, primus);
      cl.emit('news', msg);
    });
  });

  it('should support ack from client', function(done){
    var srv = http();
    var primus = server(srv, opts);
    var msg = { hi: 'hello', num: 123456 };
    srv.listen(function(){ 
      primus.on('connection', function(spark){
        spark.on('news', function (data, fn) {
          fn(null, 'received');
        });
      });
      var cl = client(srv, primus);
      cl.emit('news', msg, function (err, res) {
        expect(res).to.be('received');
        expect(err).to.be.eql(null);
        done();
      });
    });
  });

});