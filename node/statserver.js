var _ = require('lodash');
var express = require('express');
var levelup = require('levelup');
var es = require('event-stream');
var config = require('../conf/config.json');

module.exports = function (db) {
  var count = 0;
  var minTime = -1;
  var maxTime = -1;
  db.createReadStream()
  .pipe(es.map(function (data, callback) {
    var t = parseInt(data.key);
    minTime = minTime == -1 || t < minTime ? t : minTime;
    maxTime = maxTime == -1 || t > maxTime ? t : maxTime;
    count++;
    callback();
  })).on('end', function () {
    console.log("Total: ", count, minTime, new Date(minTime), maxTime, new Date(maxTime));
  });


  app = express();

  app.use(express.static(__dirname + '/public'));

  app.get('/data.:format?', function (req, res, next) {
    var startTime = parseInt(req.query.start);
    var endTime = parseInt(req.query.end);
    var step = parseInt(req.query.step);
    if (!(endTime > 0)) {
      endTime = Date.now();
    }
    if (!(startTime > 0)) {
      startTime = 0;
    }
    var duration = endTime - startTime;
    if (!(step > 0) || duration / step > 2000) {
      console.log('bad step', req.query.step, duration, step);
      step = Math.floor(duration / 1000);
      if (step < 1000) { step = 1000; }
    }
    opt = {
      start: ""+startTime,
      end: ""+endTime
    };
    var currentTime = Math.floor(startTime/step)*step;
    var bucket = [[],[],[],[],[]];
  
    summarizeBucket = function () {
      if (bucket[0].length > 0) {
        //var summary = [];
        var summary = _.map(bucket, function (metric) {
          //console.log('metric', metric);
          return {
            min: _.min(_.map(metric, function (item) { return item[1]; })),
            max: _.max(_.map(metric, function (item) { return item[2]; })),
            avg: _.reduce(metric, function (sum, item) { return sum + item[0]; }, 0)/metric.length
          };
        });
        return summary;
      } else {
        //console.log(bucket.length, bucket[0].length);
      }
    }
  
    //console.log(startTime, endTime, step);
  
    var results = [];
    var count = 0;
    res.setHeader('Content-Type', 'application/json');
    db.createReadStream(opt)
    .on('data', function (data) {
      count++;
      var time = parseInt(data.key);
      if (time > currentTime + step) {
        var summary = summarizeBucket();
        if (summary) {
          results.push({
            t: currentTime,
            d: summary
          });
        }
        currentTime = step + Math.floor(time/step)*step;
        bucket = [[],[],[],[],[]];
      }
      _.each(data.value, function (record, i) {
        if (count < 100) {
          //console.log(time, i, typeof i, record);
        }
        bucket[i].push(record);
      });
    }).on('end', function () {
      var summary = summarizeBucket();
      if (summary) {
        results.push({
          t: currentTime,
          d: summary
        });
      }
      res.send(results);
    });
  });

  app.listen(config.server.port);
  console.log("listening on port", config.server.port);
  
  return app;
}