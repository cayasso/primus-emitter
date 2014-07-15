'use strict';

var Primus = require('primus')
  , emitter = require('../')
  , http = require('http').Server
  , expect = require('expect.js')
  , opts = { transformer: 'websockets' }
  , primus
  , srv;

// creates the client
function client(srv, primus, port){
  var addr = srv.address();
  var url = 'http://' + addr.address + ':' + (port || addr.port);
  return new primus.Socket(url);
}

// creates the server
function server(srv, opts) {
  return Primus(srv, opts).use('emitter', emitter);
}

describe('primus-emitter', function () {

  beforeEach(function beforeEach(done) {
    srv = http();
    primus = server(srv, opts);
    done();
  });

  afterEach(function afterEach(done) {
    primus.end();
    done();
  });

  it('should have required methods', function (done) {
    //primus.save('testt.js');
    srv.listen(function () {
      primus.on('connection', function (spark) {
        expect(spark.reserved).to.be.a('function');
        expect(spark.send).to.be.a('function');
        expect(spark.on).to.be.a('function');
        done();
      });
      var cl = client(srv, primus);
      expect(cl.reserved).to.be.a('function');
    });
  });

  it('should emit event from server', function (done) {
    srv.listen(function () {
      primus.on('connection', function (spark) {
        spark.send('news', 'data');
      });
      var cl = client(srv, primus);
      cl.on('news', function (data) {
        expect(data).to.be('data');
        done();
      });
    });
  });

  it('should emit object from server', function (done) {
    var msg = { hi: 'hello', num: 123456 };
    srv.listen(function () {
      primus.on('connection', function (spark) {
        spark.send('news', msg);
      });
      var cl = client(srv, primus);
      cl.on('news', function (data) {
        expect(data).to.be.eql(msg);
        done();
      });
    });
  });

  it('should support ack from server', function (done) {
    var msg = { hi: 'hello', num: 123456 };
    srv.listen(function () {
      primus.on('connection', function (spark) {
        spark.send('news', msg, function (err, res) {
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

  it('should emit event from client', function (done) {
    srv.listen(function () {
      primus.on('connection', function (spark) {
        spark.on('news', function (data) {
          expect(data).to.be('data');
          done();
        });
      });
      var cl = client(srv, primus);
      cl.send('news', 'data');
    });
  });

  it('should emit object from client', function (done) {
    var msg = { hi: 'hello', num: 123456 };
    srv.listen(function () {
      primus.on('connection', function (spark) {
        spark.on('news', function (data) {
          expect(data).to.be.eql(msg);
          done();
        });
      });
      var cl = client(srv, primus);
      cl.send('news', msg);
    });
  });

  it('should support ack from client', function (done) {
    var msg = { hi: 'hello', num: 123456 };
    srv.listen(function () {
      primus.on('connection', function (spark) {
        spark.on('news', function (data, fn) {
          fn(null, 'received');
        });
      });
      var cl = client(srv, primus);
      cl.send('news', msg, function (err, res) {
        expect(res).to.be('received');
        expect(err).to.be.eql(null);
        done();
      });
    });
  });

  it('should support broadcasting from server', function (done) {
    var total = 0;
    srv.listen(function () {
      primus.on('connection', function (spark) {
        if (3 === ++total) primus.send('news', 'hi');
      });
      var cl1 = client(srv, primus)
        , cl2 = client(srv, primus)
        , cl3 = client(srv, primus);

      cl1.on('news', function (msg) {
        expect(msg).to.be('hi');
        finish();
      });

      cl2.on('news', function (msg) {
        expect(msg).to.be('hi');
        finish();
      });

      cl3.on('news', function (msg) {
        expect(msg).to.be('hi');
        finish();
      });

      function finish() {
        if (1 > --total) done();
      }
    });
  });

  it('should return `Primus` instance when broadcasting from server', function () {
    expect(primus.send('news')).to.be.a(Primus);
    srv.listen();
  });

  it('`Client#send` should not trigger `Spark` reserved events', function (done) {
    var events = Object.keys(primus.Spark.prototype.reserved.events);
    srv.listen(function () {
      primus.on('connection', function (spark) {
        events.forEach(function (ev) {
          spark.on(ev, function (data) {
            if ('not ignored' === data) {
              done(new Error('should be ignored'));
            }
          });
        });
      });
    });
    var cl = client(srv, primus);
    cl.on('open', function () {
      events.forEach(function (ev) {
        cl.send(ev, 'not ignored');
      });
      done();
    });
  });

  it('`Spark#send` should not trigger client reserved events', function (done) {
    srv.listen(function () {
      primus.on('connection', function (spark) {
        events.forEach(function (ev) {
          spark.send(ev, 'not ignored');
        });
        done();
      });
    });
    var cl = client(srv, primus)
      , events = Object.keys(cl.reserved.events);
    events.forEach(function (ev) {
      cl.on(ev, function (data) {
        if ('not ignored' === data) {
          done(new Error('should be ignored'));
        }
      });
    });
  });

  it('should only listen to event once when binding with `once`', function (done) {
    srv.listen(function () {
      primus.on('connection', function (spark) {
        spark.once('news', function (data) {
          expect(data).to.be('once');
          done();
        });
      });
      var cl = client(srv, primus);
      cl.send('news', 'once');
      cl.send('news', 'once');
    });
  });

});
