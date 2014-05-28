(function() {
  var Bucketer, Promise, StatServer, config, es, express, levelup, path, _;

  _ = require('lodash');

  path = require('path');

  express = require('express');

  levelup = require('levelup');

  es = require('event-stream');

  Promise = require('when');

  config = require('../conf/config.json');

  Bucketer = require('./bucketer');

  StatServer = (function() {
    function StatServer(db) {
      this.db = db;
      this.bucketer = Bucketer(this.db);
    }

    StatServer.prototype.start = function() {
      var app;
      app = express();
      app.use(express["static"](__dirname + '/public'));
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
          var days, deferred, maxTime, minTime, pow, promise, _fn, _i, _ref, _ref1;
          deferred = Promise.defer();
          promise = deferred.promise;
          deferred.resolve();
          days = parseInt(req.query.days);
          if (!(days > 1)) {
            days = 1;
          }
          maxTime = Date.now();
          minTime = maxTime - 86400 * 1000 * days;
          _fn = function(pow) {
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
          for (pow = _i = _ref = _this.bucketer.MIN_BUCKET, _ref1 = _this.bucketer.MAX_BUCKET; _i <= _ref1; pow = _i += 1) {
            _fn(pow);
          }
          return promise.then(function() {
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
      app.listen(config.server.port);
      console.log("listening on port", config.server.port);
      return app;
    };

    return StatServer;

  })();

  module.exports = function(db) {
    return new StatServer(db);
  };

}).call(this);
