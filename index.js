var tessel = require('tessel');
var climatelib = require('climate-si7020');
var wifi = require('wifi-cc3000');
var async = require('async');

var climate = climatelib.use(tessel.port.A);

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
    callback(null, result);
  });
}

climate.on('ready', function() {
  console.log('climate sensor ready');
  readSensor(function(err, result) {
    if (err) {
      console.error(err);
    } else {
      console.log(result);
    }
  });
});