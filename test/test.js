'use strict';

var Primus = require('primus')
  , emitter = require('../')
  , chai = require('chai')
  , http = require('http')
  , expect = chai.expect
  , Socket
  , primus
  , srv;

chai.config.includeStack = true;

// creates the client
function client() {
  var addr = srv.address();

  if (!addr) throw new Error('Server is not listening');

  return new Socket('http://localhost:' + addr.port);
}

beforeEach(function beforeEach(done) {
  srv = http.createServer();
  primus = new Primus(srv).plugin('emitter', emitter);
  Socket = Socket || primus.Socket;
  srv.listen(done);
});

afterEach(function afterEach(done) {
  primus.end(done);
});

describe('primus-emitter', function () {
  it('should have required methods', function (done) {
    primus.on('connection', function (spark) {
      expect(spark.reserved).to.be.a('function');
      expect(cl.reserved).to.be.a('function');
      expect(spark.send).to.be.a('function');
      expect(spark.on).to.be.a('function');
      done();
    });

    var cl = client();
  });

  it('should emit event from server', function (done) {
    primus.on('connection', function (spark) {
      spark.send('news', 'data');
    });

    client().on('news', function (data) {
      expect(data).to.equal('data');
      done();
    });
  });

  it('should emit object from server', function (done) {
    var msg = { hi: 'hello', num: 123456 };

    primus.on('connection', function (spark) {
      spark.send('news', msg);
    });

    client().on('news', function (data) {
      expect(data).to.eql(msg);
      done();
    });
  });

  it('should support ack from server', function (done) {
    var msg = { hi: 'hello', num: 123456 };

    primus.on('connection', function (spark) {
      spark.send('news', msg, function (err, res) {
        expect(res).to.equal('received');
        expect(err).to.equal(null);
        done();
      });
    });

    client().on('news', function (data, fn) {
      fn(null, 'received');
    });
  });

  it('should emit event from client', function (done) {
    primus.on('connection', function (spark) {
      spark.on('news', function (data) {
        expect(data).to.equal('data');
        done();
      });
    });

    client().send('news', 'data');
  });

  it('should emit object from client', function (done) {
    var msg = { hi: 'hello', num: 123456 };

    primus.on('connection', function (spark) {
      spark.on('news', function (data) {
        expect(data).to.eql(msg);
        done();
      });
    });

    client().send('news', msg);
  });

  it('should support ack from client', function (done) {
    var msg = { hi: 'hello', num: 123456 };

    primus.on('connection', function (spark) {
      spark.on('news', function (data, fn) {
        fn(null, 'received');
      });
    });

    client().send('news', msg, function (err, res) {
      expect(res).to.equal('received');
      expect(err).to.equal(null);
      done();
    });
  });

  it('should support broadcasting from server', function (done) {
    var total = 0;

    function finish() {
      if (1 > --total) done();
    }

    primus.on('connection', function () {
      if (3 === ++total) primus.send('news', 'hi');
    });

    var cl1 = client()
      , cl2 = client()
      , cl3 = client();

    cl1.on('news', function (msg) {
      expect(msg).to.equal('hi');
      finish();
    });

    cl2.on('news', function (msg) {
      expect(msg).to.equal('hi');
      finish();
    });

    cl3.on('news', function (msg) {
      expect(msg).to.equal('hi');
      finish();
    });
  });

  it('should return `Primus` instance when broadcasting from server', function () {
    expect(primus.send('news')).to.equal(primus);
  });

  it('`Client#send` should not trigger `Spark` reserved events', function (done) {
    var events = Object.keys(primus.Spark.prototype.reserved.events);

    primus.on('connection', function (spark) {
      events.forEach(function (ev) {
        spark.on(ev, function (data) {
          if ('not ignored' === data) {
            done(new Error('should be ignored'));
          }
        });
      });
    });

    var cl = client();

    cl.on('open', function () {
      events.forEach(function (ev) {
        cl.send(ev, 'not ignored');
      });
      done();
    });
  });

  it('`Spark#send` should not trigger client reserved events', function (done) {
    primus.on('connection', function (spark) {
      events.forEach(function (ev) {
        spark.send(ev, 'not ignored');
      });
      done();
    });

    var cl = client()
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
    primus.on('connection', function (spark) {
      spark.once('news', function (data) {
        expect(data).to.equal('once');
        done();
      });
    });

    var cl = client();

    cl.send('news', 'once');
    cl.send('news', 'once');
  });

  it('should drop invalid packets', function (done) {
    primus.on('connection', function (spark) {
      spark.emitter.onevent = spark.emitter.onack = function () {
        done(new Error('should not be called'));
      };
      spark.on('end', done);
    });

    client().on('open', function () {
      this.write({
        type: emitter.Emitter.packets.EVENT,
        data: 'foo'
      });

      this.write({
        type: emitter.Emitter.packets.ACK,
        id: '__defineGetter__',
        data: ['foo']
      });

      this.write({
        data: ['foo'],
        type: 2
      });

      this.end();
    });
  });
});
