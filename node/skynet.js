var skynet = require('skynet');
var config = require('../conf/config.json');
var levelup = require('levelup');

var token = config.skynet.token;
var myId = config.skynet.uuid;

module.exports = function (db) {
  var conn = skynet.createConnection({
    uuid: myId,
    token: token,
    protocol: 'websocket'
  });

  conn.on('notReady', function(data){
    console.log('UUID FAILED AUTHENTICATION!');
    console.log(data);
  });

  conn.on('ready', function(data){
    console.log('UUID AUTHENTICATED!');
    console.log(data);
    
    conn.subscribe({
      "uuid": "10fcc091-e39c-11e3-93f8-f3e7e8d1cce9"//,
      //"token": "dvtkvr4hfr6enrk9o3516n8aaf7uv7vi"
    }, function (data) {
      console.log("subscribe data");
      console.log(data);
    });
    
    conn.on('message', function(){
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