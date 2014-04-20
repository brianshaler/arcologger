var levelup = require('levelup');
var es = require('event-stream');

var db = levelup('./sensortest', {
  valueEncoding: 'json'
});

var count = 0;
var minTime = -1;
var maxTime = -1;
var lastItem = null;
db.createReadStream()
.pipe(es.map(function (data, callback) {
  lastItem = data.value;
  var t = parseInt(data.key);
  minTime = minTime == -1 || t < minTime ? t : minTime;
  maxTime = maxTime == -1 || t > maxTime ? t : maxTime;
  count++;
  callback();
})).on('end', function () {
  console.log("Total: ", count, new Date(minTime), new Date(maxTime));
  console.log(lastItem);
});
