var levelup = require('levelup');
var Skynet = require('./node/skynet');
var StatServer = require('./node/statserver');
var Bucketer = require('./node/bucketer');

var db = levelup(__dirname+'/sensordata', {
  valueEncoding: 'json'
});

var skynet = Skynet(db);
var statServer = StatServer(db);
var bucketer = Bucketer(db);

statServer.start();

opt = {
  limit: 1,
  start: '1',
  end: '2'
};

var oldest = null;
db.createReadStream(opt)
.on('data', function (data) {
  console.log('oldest', data.key, '=', data.value)
  oldest = parseInt(data.key);
})
.on('error', function (err) {
  console.log('Error!', err)
})
.on('end', function () {
  if (oldest) {
    
  }
});

//Bucketer.bucket(
