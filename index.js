var tessel = require('tessel');
var climatelib = require('climate-si7020');
var wifi = require('wifi-cc3000');
var led = require('tessel-led');
var async = require('async');
var config = require('./config');
var Keen = require('./keen');

var climate = climatelib.use(tessel.port.A);
var keen = new Keen(config.keen);

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
    keen.addEvent(config.keen.collection, data, callback);
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
      console.error(err);
    } else {
      led.blue.blink(1000);
      console.log(result);
    }
    setTimeout(doWork, config.delay);
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

wifi.on('connect', function(res){
  console.log('wifi connected:', res);
}).on('disconnect', function(){
  console.log('wifi disconnected');
})
.on('timeout', function() {
  console.error('wifi timeout');
})
.on('error', function(err) {
  console.error('wifi error:', err, err.stack);
});
