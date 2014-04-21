var skynet = require('skynet');
var config = require('../conf/config.json');

var token = config.skynet.token;
var myId = config.skynet.uuid;

 var conn = skynet.createConnection({
    uuid: myId,
    token: token
  });


conn.on('notReady', function(data){
  console.log('UUID FAILED AUTHENTICATION!');
  console.log(data);
});

conn.on('ready', function(data){
  console.log('UUID AUTHENTICATED!');
  console.log(data);

  conn.on('message', function(channel, message){
    console.log('message received', channel, message);
  });
});


