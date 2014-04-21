var skynet = require('skynet');
var config = require('../conf/config.json');
var levelup = require('levelup');

var token = config.skynet.token;
var myId = config.skynet.uuid;

module.exports = function (db) {
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
      var payloadText;
      var payload;
      if (message && message.payload) {
        payloadText = message.payload;
      }
      if (!payloadText && channel && channel.payload) {
        payloadText = channel.payload;
      }
      try {
        payload = JSON.parse(payloadText);
      } catch (ex) {
        console.log(ex);
        console.log(channel, message);
      }
      
      if (payload) {
        db.put(""+Date.now(), payload);
      }
      console.log('message received', payloadText);
    });
  });
}