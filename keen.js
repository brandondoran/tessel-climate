var jsonist = require("jsonist");

function KeenClient() {
  var options = arguments[0] === undefined ? {} : arguments[0];

  this._urlBase = options.urlBase || "https://api.keen.io";
  this._version = options.version || "3.0";
  this._writeKey = options.writeKey;
  this._readKey = options.readKey;
  this._masterKey = options.masterKey;
  this._projectId = options.projectId;
  this._url = "" + this._urlBase + "/" + this._version + "/projects/" + this._projectId + "/events";
}

function apiOptions(apiKey) {
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey
    }
  };
}

KeenClient.prototype._getUrl = function (path) {
  return path ? "" + this._url + "/" + path : this._url;
};

KeenClient.prototype.addEvent = function (collection, event, callback) {
  if (!collection) {
    return callback(new Error("you must specify a collection"));
  }

  jsonist.post(this._getUrl(collection), event, apiOptions(this._writeKey),
    function(err, body, res) {
      if (err) {
        return callback(err);
      }
      callback(null, body);
    });
};

KeenClient.prototype.addEvents = function (events, callback) {
  jsonist.post(this._url, events, apiOptions(this._writeKey), callback);
};

KeenClient.prototype.getEvent = function (collection, callback) {
  if (!collection) {
    return callback(new Error("you must specify a collection"));
  }

  jsonist.get(this._getUrl(collection), apiOptions(this._masterKey), callback);
};

KeenClient.prototype.getEvents = function (projectId, callback) {
  var url = "" + this._urlBase + "/" + this._version + "/projects/" + projectId + "/events";
  jsonist.get(url, apiOptions(this._masterKey), callback);
};

module.exports = KeenClient;
