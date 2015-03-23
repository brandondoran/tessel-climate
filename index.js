var tessel = require('tessel');
var climatelib = require('climate-si7020');
var wifi = require('wifi-cc3000');
var async = require('async');
var Keen = require('keen-js');

var climate = climatelib.use(tessel.port.A);
var keen = new Keen({
  writeKey: '565ef9dbdde2f0039758c2b41222228be7ee65a1c3251c7068b5c7dca9dd8ef21b906fdd6d65f1bc8658ca85f87e769c939440a8ee4876016d0ce0679503ccebbe14c5f4e1e33d748fd2c73ac8da2a91ed17cb24179d6805617d3dab38d271bd7a95eac83acdfc4f4142e952a09bcd77',
  projectId: '550ba184c1e0ab2052426f3a'
});

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
    keen.addEvent('climate', data, callback);
  } else {
    console.log('Event not reported: no wifi connection.');
    process.nextTick(callback);
  }
}

function doWork () {
  async.auto({
    request: function(done) {
      readSensor(done);
    },
    response: ['request', function(done, results) {
      postData(results.request, done);
    }]
  }, function(err, result) {
    if (err) {
      console.error(err);
    } else {
      console.log(result);
    }
    setTimeout(doWork, 30000);
  });
}

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
