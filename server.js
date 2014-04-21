var levelup = require('levelup');
var Skynet = require('./node/skynet');
var StatServer = require('./node/statserver');

var db = levelup(__dirname+'/sensordata', {
  valueEncoding: 'json'
});

var skynet = Skynet(db);
var StatServer = StatServer(db);
