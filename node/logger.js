var _ = require('lodash');
var sys = require("sys");
var repl = require("repl");
var serialPort = require("serialport").SerialPort;
var levelup = require('levelup');
var es = require('event-stream');
//var byline = require('byline');

var db = levelup('./sensortest', {
  valueEncoding: 'json'
});

// Create new serialport pointer
var serial = new serialPort("/dev/tty.usbmodem1411" , { baudrate : 115200 });

// Add data read event listener
//serial.on( "data", function( chunk ) {
//    sys.puts(chunk);
//});



var rolling = [[],[],[]];
var rollingCount = 40;

var stream = serial // byline(serial, {encoding: 'utf8'})
.pipe(es.split())
.pipe(es.map(function (data, callback) {
  try {
    _data = JSON.parse(data);
  } catch (ex) {
    sys.puts("Something is wrong: (parse): " + data);
    return callback();
  }
  data = _data;
  if (!typeof data[0] == 'number') {
    sys.puts("Something is wrong (type): " + data);
    return callback();
  }
  rolling[0].push(data[0]);
  rolling[1].push(data[1]);
  rolling[2].push(data[2]);
  if (rolling[0].length > rollingCount) {
    data = _.map(rolling, function (metric) {
      min = _.min(metric);
      max = _.max(metric);
      average = Math.round(_.reduce(metric, function (sum, record) { return sum + record; }, 0) / metric.length);
      return [average, min, max];
    });
    /** /
    data = [0,0,0];
    for (i=0; i<3; i++) {
      for (j=0; j<rolling[i].length; j++) {
        data[i] += rolling[i][j];
      }
      data[i] = Math.round(data[i]/rolling[i].length);
    }
    data[3] = rolling[0].length;
    /**/
    rolling = [[],[],[]];
    return callback(null, data);
  } else {
    return callback();
  }
}))
.pipe(es.map(function (data, callback) {
  sys.puts("data "+data.length+": " + JSON.stringify(data));
  if (1==1 || Math.random() > 0.1) {
  }
  db.put(""+Date.now(), data);
  callback(null, data);
}))

serial.on( "error", function( msg ) {
    //sys.puts("error: " + msg );
});

repl.start( "=>" );