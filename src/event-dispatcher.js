// Sends events to new API Gateway endpoint (https://api.autochart.io/tracked-events/)
import jsonp from 'jsonp';
import base64 from './lib/base64';

// ctor
function EventDispatcher(customerAccountId, options) {
    this.customerAccountId = customerAccountId;
    this.options = options || {};
}

function noop() {}

EventDispatcher.prototype.addEvent = function addEvent(collectionName, data, done) {
    const complete = done || noop;
    const url = getUrl(this.customerAccountId, collectionName, data);
    jsonp(url, {
        param: 'callback',
        timeout: 60000,
        prefix: '__jp'
    }, (err, response) => {
        complete(err, {
            created: true,
            response
        });
    });
};

function getUrl(customerAccountId, collectionName, data) {
    return `https://api.autochart.io/tracked-events/${customerAccountId}/${encodeURIComponent(collectionName)
    }?data=${base64.encode(JSON.stringify(data || {}))}`;
}

export default EventDispatcher;
