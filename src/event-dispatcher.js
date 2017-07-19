// Sends events to new API Gateway endpoint (https://api.autochart.io/tracked-events/)
var base64 = require('./lib/base64');

// ctor
function EventDispatcher(customerAccountId, options) {
    this.customerAccountId = customerAccountId;
    this.options = options || {};
}

EventDispatcher.prototype.addEvent = function(collectionName, data, done) {
    var url = getUrl(this.customerAccountId, collectionName, data);
    console.log('sending data to : ' + url);
    if (done) {
        done(null, {
            created: true
        });
    }
};

function getUrl(customerAccountId, collectionName, data) {
    return 'https://api.autochart.io/tracked-events/' + customerAccountId + '/' + collectionName
        + '?data=' + base64.encode(JSON.stringify(data));
}

module.exports = EventDispatcher;
