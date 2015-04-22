var tessel = require('tessel');
var climatelib = require('climate-si7020');
var wifi = require('wifi-cc3000');
var led = require('tessel-led');
var async = require('async');
var config = require('./config');
//var Keen = require('keen-js');
var keen = require('keen-event-client');

var climate = climatelib.use(tessel.port.A);
var client = keen.createClient(config.keen);
var timeouts = 0;

function wifiConnect(){
  console.log('attempting wifi connection');
  wifi.connect(config.wifi);
}

function wifiPowerCycle(){
  // when the wifi chip resets, it will automatically try to reconnect
  // to the last saved 
  console.log('power cycling wifi');
  wifi.reset(function(){
    timeouts = 0; // reset timeouts
    console.log('done power cycling wifi');
    // give it some time to auto reconnect
    setTimeout(function(){
      if (!wifi.isConnected()) {
        // try to reconnect
        wifiConnect();
      }
    }, 20 * 1000);
  });
}

function readSensor (callback) {
  async.series({
    temp: function(done) {
      climate.readTemperature('f', done);      
    },
    rh: function(done) {
      climate.readHumidity(done);
    }
  }, function(err, result) {
    if (err) {
      return callback(err);
    }
    result.timestamp = (new Date()).toISOString();
    result.deviceId = tessel.deviceId();
    callback(null, result);
  });
}

function postData (data, callback) {
  if (wifi.isConnected) {
    client.addEvent(config.keen.collection, data, callback);
  } else {
    console.log('Event not reported: no wifi connection.');
    process.nextTick(callback);
  }
}

var doWork = function doWork () {
  doWork.counter++;
  console.log('doWork calls:', doWork.counter);
  async.auto({
    request: function(done) {
      readSensor(done);
    },
    response: ['request', function(done, results) {
      postData(results.request, done);
    }]
  }, function(err, result) {
    if (err) {
      led.red.blink(1000);
      console.error('http request error:', err, err.stack);
      wifiPowerCycle();
      setTimeout(doWork, config.delay);
    } else {
      led.blue.blink(1000);
      console.log(result);
      setTimeout(doWork, config.delay);
    }
  });
};

doWork.counter = 0;

climate.on('ready', function() {
  console.log('climate sensor ready');
  doWork();
})
.on('error', function(err) {
  console.error('climate error:', err, err.stack);
});

wifi.on('connect', function(res) {
  console.log('wifi ready');
})
.on('disconnect', function(){
  console.log('wifi disconnected');
  wifiConnect();
})
.on('timeout', function() {
  console.error('wifi timeout');
  timeouts++;
  if (timeouts > 2) {
    // reset the wifi chip if we've timed out too many times
    wifiPowerCycle();
  } else {
    // try to reconnect
    wifiConnect();
  }
})
.on('error', function(err) {
  console.error('wifi error:', err, err.stack);
  wifiPowerCycle();
});
