(function() {
  var Bucketer, Promise, StatServer, bodyParser, config, es, express, levelup, path, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require('lodash');

  path = require('path');

  express = require('express');

  bodyParser = require('body-parser');

  levelup = require('levelup');

  es = require('event-stream');

  Promise = require('when');

  config = require('../conf/config.json');

  Bucketer = require('./bucketer');

  StatServer = (function() {
    function StatServer(db) {
      this.db = db;
      this.autoCache = __bind(this.autoCache, this);
      this.cache = __bind(this.cache, this);
      this.bucketer = Bucketer(this.db);
    }

    StatServer.prototype.start = function() {
      var app;
      app = express();
      app.use(express["static"](__dirname + '/public'));
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({
        extended: true
      }));
      app.get('/test.json', (function(_this) {
        return function(req, res, next) {
          var opt, results;
          opt = {
            start: '2',
            limit: 2
          };
          results = [];
          return _this.db.createReadStream(opt).on('data', function(data) {
            return results.push(data);
          }).on('close', function() {
            return res.send(results);
          });
        };
      })(this));
      app.get('/data.:format?', (function(_this) {
        return function(req, res, next) {
          var cacheStep, duration, endTime, save, startTime, step;
          startTime = parseInt(req.query.start);
          endTime = parseInt(req.query.end);
          step = parseInt(req.query.step);
          cacheStep = parseInt(req.query.cache);
          if (!(cacheStep > 0)) {
            cacheStep = 0;
          }
          save = req.query.save === 'true' ? true : false;
          if (!(endTime > 0)) {
            endTime = Date.now();
          }
          if (!(startTime > 0)) {
            startTime = 0;
          }
          duration = endTime - startTime;

          /*
          unless step > 0 and duration / step < 2000
            console.log 'bad step', req.query.step, duration, step
            step = Math.floor duration / 1000
            step = 1000 if step < 1000
           */
          if (!(step > 0 && duration / step < 2000)) {
            endTime = startTime + step * 2000;
          }
          res.setHeader('Content-Type', 'application/json');
          return _this.bucketer.get(startTime, endTime, step, cacheStep, save).then(function(data) {
            return res.send(data);
          })["catch"](function(err) {
            return res.send(err);
          });
        };
      })(this));
      app.get('/cache.:format?', (function(_this) {
        return function(req, res, next) {
          var days;
          days = parseInt(req.query.days);
          if (!(days > 1)) {
            days = 1;
          }
          return _this.cache(days, function(err) {
            return res.send('done');
          });
        };
      })(this));
      app.get('/clean.:format?', (function(_this) {
        return function(req, res, next) {
          var first, last, opt, ws;
          last = Date.now();
          first = Date.now() - 86400 * 1000 * 365;
          ws = _this.db.createWriteStream();
          opt = {
            end: "" + first
          };
          return _this.db.createReadStream(opt).on('data', function(data) {
            return ws.write({
              type: 'del',
              key: data.key
            });
          }).on('close', function() {
            opt = {
              start: "" + last
            };
            return _this.db.createReadStream(opt).on('data', function(data) {
              return ws.write({
                type: 'del',
                key: data.key
              });
            }).on('close', function() {
              return res.send('done');
            });
          });
        };
      })(this));
      app.post('/save.:format', (function(_this) {
        return function(req, res, next) {
          var ex, payload;
          try {
            payload = JSON.parse(req.body.payload);
            if (payload) {
              _this.db.put("" + (Date.now()), payload);
            }
          } catch (_error) {
            ex = _error;
            return next(ex);
          }
          return res.send('1');
        };
      })(this));
      app.post('/test.:format', (function(_this) {
        return function(req, res, next) {
          var payload;
          payload = JSON.parse(req.body.payload);
          console.log('payload test', payload);
          return res.send(req.body.payload);
        };
      })(this));
      app.listen(config.server.port);
      return console.log("listening on port", config.server.port);
    };

    StatServer.prototype.cache = function(days, next) {
      var deferred, maxTime, minTime, pow, promise, _fn, _i, _ref, _ref1;
      if (days == null) {
        days = 1;
      }
      deferred = Promise.defer();
      promise = deferred.promise;
      deferred.resolve();
      maxTime = Date.now();
      minTime = maxTime - 86400 * 1000 * days;
      _fn = (function(_this) {
        return function(pow) {
          var step;
          step = 1000 * Math.pow(2, pow);
          return promise = promise.then(function() {
            var cacheStep;
            cacheStep = null;
            if (pow > _this.bucketer.MIN_BUCKET) {
              cacheStep = step / 2;
            }
            return _this.bucketer.get(minTime, maxTime, step, cacheStep, true);
          });
        };
      })(this);
      for (pow = _i = _ref = this.bucketer.MIN_BUCKET, _ref1 = this.bucketer.MAX_BUCKET; _i <= _ref1; pow = _i += 1) {
        _fn(pow);
      }
      return promise.then(function() {
        return next();
      })["catch"](function(err) {
        return next(err);
      });
    };

    StatServer.prototype.autoCache = function() {
      return this.cache(1, (function(_this) {
        return function() {
          return setTimeout(function() {
            return _this.autoCache();
          }, 60 * 1000);
        };
      })(this));
    };

    return StatServer;

  })();

  module.exports = function(db) {
    return new StatServer(db);
  };

}).call(this);
