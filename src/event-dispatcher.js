// Sends events to new API Gateway endpoint (https://api.autochart.io/tracked-events/)
var base64 = require('./lib/base64');
var jsonp = require('jsonp');

// ctor
function EventDispatcher(customerAccountId, options) {
    this.customerAccountId = customerAccountId;
    this.options = options || {};
}

function noop() {}

EventDispatcher.prototype.addEvent = function(collectionName, data, done) {
    done = done || noop;
    var url = getUrl(this.customerAccountId, collectionName, data);
    console.log('sending data to : ' + url);
    jsonp(url, {
        param: 'callback', // name of the query string parameter to specify the callback (defaults to callback)
        timeout: 60000, // how long after a timeout error is emitted. 0 to disable (defaults to 60000)
        prefix: '__jp'//, // (String) prefix for the global callback functions that handle jsonp responses (defaults to __jp)
        // name: (String) name of the global callback functions that handle jsonp responses (defaults to prefix + incremented counter)
    }, function(err, response) {
        done(err, {
            created: true,
            response: response
        });
    });
};

function getUrl(customerAccountId, collectionName, data) {
    return 'https://api.autochart.io/tracked-events/' + customerAccountId + '/' + encodeURIComponent(collectionName)
        + '?data=' + base64.encode(JSON.stringify(data || {}));
}

module.exports = EventDispatcher;
