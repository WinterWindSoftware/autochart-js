require('./polyfills');
var config = require('./Config');
var KeenTrack = require('../bower_components/keen-js/dist/keen-tracker.js');
var BrowserContext = require('./BrowserContext');
var Utils = require('./Utils');
var disabledAccounts = config.disabledAccounts;

var ACTIONS_COLLECTION = 'VisitorActions';
var TAGS_COLLECTION = 'VisitorTags';

/**
 * Tracking API instance.
 * @constructor
 */

function Tracker() {}

//@accountKey: String
//@context: { session: { visitorId, sessionId, referrer, userAgent, startTime }, page: { url} }

/**
 * Initialise the Tracker with account key and custom options.
 * @param  {string} accountKey - unique tracking key for your AutoChart account. Required.
 * @param  {object} options - Array of options to override certain tracking behaviour
 * @param  {BrowserContext} context - tracker uses this to access browser data (DOM, URL, cookies, etc.)
 */
Tracker.prototype.init = function(accountKey, options, context) {
    if (!accountKey) {
        throw new Error('accountKey must be specified');
    }
    if (typeof accountKey !== 'string' || accountKey.length !== 24) {
        throw new Error('Invalid account key. It must be a 24 character long string.');
    }
    if (options) {
        this._options = options;

    } else {
        this._options = {};
    }
    this._timeout = 1000;
    this._trackingDisabled = (window.AUTOCHART_DISABLED === true) || Utils.includes(disabledAccounts, accountKey);
    if (this._trackingDisabled) {
        Utils.log('Tracking disabled. No events will be sent');
    }
    context = context || new BrowserContext(window);
    this.dispatcher = new KeenTrack(config.keen);


    // =============================================================================================
    // INIT
    // =============================================================================================

    //Setup global properties to be sent with all events on this page
    this._globalProperties = {
        session: context.session,
        urlRaw: context.page.url,
        pageTitle: context.page.title,
        dayOfWeek: (context.page.timestamp && context.page.timestamp.getDay) ? context.page.timestamp.getDay() : new Date().getDay(),
        keen: {
            timestamp: context.page.timestamp || undefined
        }
    };
    this._globalProperties.session.customerAccountId = accountKey;
    this._globalProperties.session.userAgentRaw = context.session.userAgentRaw || '${keen.user_agent}';
    this._globalProperties.session.ipAddress = context.session.ipAddress || '${keen.ip}';

    this._globalProperties.keen.addons = [];
    if (this._globalProperties.urlRaw) {
        this._globalProperties.keen.addons.push({
            name: 'keen:url_parser',
            input: {
                url: 'urlRaw'
            },
            output: 'url'
        });
    }
    if (this._globalProperties.session.ipAddress) {
        this._globalProperties.keen.addons.push({
            name: 'keen:ip_to_geo',
            input: {
                ip: 'session.ipAddress'
            },
            output: 'session.ipLocation'
        });
    }
    if (this._globalProperties.session.userAgentRaw) {
        this._globalProperties.keen.addons.push({
            name: 'keen:ua_parser',
            input: {
                'ua_string': 'session.userAgentRaw'
            },
            output: 'session.userAgent'
        });
    }
    if (this._globalProperties.session.referrerRaw) {
        this._globalProperties.keen.addons.push({
            name: 'keen:referrer_parser',
            input: {
                'referrer_url': 'session.referrerRaw',
                'page_url': 'urlRaw'
            },
            output: 'session.referrer'
        });
    }

    //Send pageview event on load
    this.page();
};

// =============================================================================================
// TRACKING API FUNCTIONS
// =============================================================================================
/**
 * Send a 'PageView' VisitorAction event. This is automatically called in init so is usually not required.
 * @param  {function} success - callback fired when event successfully sent.
 * @param  {function} error - callback fired when event successfully sent.
 */
Tracker.prototype.page = function(success, error) {
    return this._trackVisitorAction('PageView', null, null, success, error);
};

/**
 * Send a 'VehicleView' VisitorAction event for a specific vehicle.
 * @param  {Vehicle} vehicle
 * @param  {Date} timestamp - time the event was sent. If not specified, defaults to Date.now().
 * @param  {function} success - callback fired when event successfully sent.
 * @param  {function} error - callback fired when event successfully sent.
 */
Tracker.prototype.trackVehicleView = function(vehicle, timestamp, success, error) {
    return this._trackVisitorAction('VehicleView', {
        vehicles: [vehicle]
    }, timestamp, success, error);
};

/**
 * Send a 'VehicleAction' VisitorAction event for a specific vehicle.
 * @param  {Vehicle} vehicle
 * @param  {string} actionCategory - category of the action, e.g. 'Save', 'Compare', 'Print'
 * @param  {Date} timestamp - time the event was sent. If not specified, defaults to Date.now().
 * @param  {function} success - callback fired when event successfully sent.
 * @param  {function} error - callback fired when event successfully sent.
 */
Tracker.prototype.trackVehicleAction = function(vehicle, actionCategory, timestamp, success, error) {
    return this._trackVisitorAction('VehicleAction', {
            vehicles: [vehicle],
            actionCategory: actionCategory
        },
        timestamp, success, error);
};

/**
 * Sends a 'Search' VisitorAction event for a specific vehicle.
 * @param  {SearchCriteria} searchCriteria - criteria used to do the search.
 * @param  {Date} timestamp - time the event was sent. If not specified, defaults to Date.now().
 * @param  {function} success - callback fired when event successfully sent.
 * @param  {function} error - callback fired when event successfully sent.
 */
Tracker.prototype.trackSearch = function(searchCriteria, timestamp, success, error) {
    return this._trackVisitorAction('Search', {
        searchCriteria: searchCriteria
    }, timestamp, success, error);
};

/**
 * Sends a 'VisitIntent' VisitorAction event for a specific vehicle.
 * @param  {string} intentAction
 * @param  {Date} timestamp - time the event was sent. If not specified, defaults to Date.now().
 * @param  {function} success - callback fired when event successfully sent.
 * @param  {function} error - callback fired when event successfully sent.
 */
Tracker.prototype.trackVisitIntent = function(intentAction, timestamp, success, error) {
    return this._trackVisitorAction('VisitIntent', {
        intentAction: intentAction
    }, timestamp, success, error);
};

/**
 * Sends a Tag event with one or more tags.
 * @param  {[string]} tags - array of tags to associate with this visitor. Required.
 * @param  {function} success - callback fired when event successfully sent.
 * @param  {function} error - callback fired when event successfully sent.
 */
Tracker.prototype.tag = function(tags, success, error) {
    if (this._trackingDisabled) {
        return false;
    }
    this._ensureInit();
    if (!tags) {
        throw new Error('tags parameter must be specified');
    }
    var tagsArray = (tags instanceof Array) ? tags : [tags.toString()];
    // Sanitize tags (strip out non alphanumeric plus space dash underscore)
    for (var i = 0; i < tagsArray.length; i++) {
        tagsArray[i] = tagsArray[i].toString().replace(/[^\w\s-]/gi, '');
    }
    var actionData = this._mergeGlobalProps({
        tags: tagsArray
    });
    Utils.log('Tag tracked', tags);
    return this.dispatcher.addEvent(TAGS_COLLECTION, actionData, this._getEventCallback('Tag', success, actionData), this._getErrorCallback(error, actionData));
};


/**
 * Sends a Lead event after visitor has performed an action such as submitting an enquiry form.
 * @param  {Lead} lead
 * @param  {Date} timestamp - time the event was sent. If not specified, defaults to Date.now().
 * @param  {function} success - callback fired when event successfully sent.
 * @param  {function} error - callback fired when event successfully sent.
 */
Tracker.prototype.trackLead = function(lead, timestamp, success, error) {
    if (this._trackingDisabled) {
        return false;
    }
    this._ensureInit();
    if (!lead) {
        throw new Error('Lead must be specified');
    }
    var data = this._mergeGlobalProps({
        channel: lead.channel,
        subject: lead.subject,
        contact: lead.contact,
        message: lead.message,
        vehicle: lead.vehicle,
        recipient: lead.recipient
    }, timestamp);
    Utils.log('Lead tracked', lead);
    return this.dispatcher.addEvent('Leads', data, this._getEventCallback('Lead', success, data), this._getErrorCallback(error, data));
};

/**
 * Tells the Tracker to send a lead event whenever a form is submitted.
 * @param  {HTMLElement} form - <form> node
 * @param  {function} leadFunction - function which will be evaluated when the form is submitted. It must return a Lead object which will then be sent to AutoChart.
 * @param  {Date} timestamp - time the event was sent. If not specified, defaults to Date.now().
 * @param  {function} success - callback fired when event successfully sent.
 * @param  {function} error - callback fired when event successfully sent.
 */
Tracker.prototype.trackLeadForm = function(form, leadFunction, timestamp, success, error) {
    if (this._trackingDisabled) {
        return false;
    }
    var self = this;
    self._ensureInit();
    if (!leadFunction || !Utils.isFunction(leadFunction)) {
        throw new Error('A function must be specified to return the lead data when the form is submitted.');
    }
    if (form) {
        var handler = function(e) {
            Utils.prevent(e);
            var lead = leadFunction();
            //Track the lead
            self.trackLead(lead, timestamp, success, error);
            //Proceed with submitting the form
            if (!self._options.preventFormSubmits) {
                self._callback(function() {
                    form.submit();
                });
            } else {
                Utils.log('Preventing submit of form.');
            }
        };
        //Wire up submit handler (preferably via jquery)
        var $ = window.jQuery || window.Zepto;
        if ($) {
            $(form).submit(handler);
        } else {
            if (form.addEventListener) {
                form.addEventListener('submit', handler, false);
            } else if (form.attachEvent) {
                form.attachEvent('onsubmit', handler);
            }
        }
    }
};

Tracker.prototype.trackLeadFormAspNet = function(options, leadFunction, timestamp, success, error) {
    if (this._trackingDisabled) {
        return false;
    }
    var self = this;
    options = options || {};
    self._ensureInit();
    if (!leadFunction || !Utils.isFunction(leadFunction)) {
        throw new Error('A function must be specified to return the lead data when the form is submitted.');
    }
    Utils.aspnet.beforePostbackAsync(options.submitButtonId, function(doPostback) {
        var lead = leadFunction();
        self.trackLead(lead, timestamp, success, error);
        self._callback(function() {
            doPostback();
        });
    });
};

/**
 * Sends a 'Finance' VisitorAction event, with finance data.
 * @param  {Finance} financeData - financial data to save. Required.
 * @param  {[type]} vehicle     - vehicle to which finance action was related
 * @param  {Date} timestamp - time the event was sent. If not specified, defaults to Date.now().
 * @param  {function} success - callback fired when event successfully sent.
 * @param  {function} error - callback fired when event successfully sent.
 */
Tracker.prototype.trackFinance = function(financeData, vehicle, timestamp, success, error) {
    if (!financeData) {
        throw new Error('financeData object must be specified');
    }
    return this._trackVisitorAction('Finance', {
        finance: financeData,
        vehicles: [vehicle]
    }, timestamp, success, error);
};

/**
 * Calls specified function whenever the library has asynchronously loaded.
 * @param  {Function} callback function to call
 */
Tracker.prototype.ready = function(callback) {
    if (callback && Utils.isFunction(callback)) {
        callback();
    }
};


// =============================================================================================
// PRIVATES
// =============================================================================================

Tracker.prototype._ensureInit = function() {
    if (!this._globalProperties.session.customerAccountId) {
        throw new Error('init() must be called before calling this method.');
    }
};

Tracker.prototype._trackVisitorAction = function(actionType, data, timestamp, success, error) {
    if (this._trackingDisabled) {
        return false;
    }
    this._ensureInit();
    var actionData = this._mergeGlobalProps(data || {}, timestamp);
    actionData.actionType = actionType;
    Utils.log('VisitorAction tracked: ' + actionType, data);
    return this.dispatcher.addEvent(ACTIONS_COLLECTION, actionData,
        this._getEventCallback('VisitorAction', success, actionData), this._getErrorCallback(error, actionData));
};

Tracker.prototype._mergeGlobalProps = function(eventData, timestamp) {
    var merged = Utils._extend({}, this._globalProperties, eventData);
    if (timestamp) {
        merged.keen.timestamp = eventData.timestamp;
    }
    return merged;
};

Tracker.prototype._callback = function(fn) {
    Utils.callAsync(fn, this._timeout || 1000);
    return this;
};

Tracker.prototype._getErrorCallback = function(overrideCallback, evtData) {
    return this._getEventCallback('Error', overrideCallback, evtData);
};

Tracker.prototype._getEventCallback = function(eventSuffix, overrideCallback, evtData) {
    var self = this;
    var cb = function(response) {
        if (self._options.raiseEvents && document.dispatchEvent) {
            var evt = new CustomEvent('AutoChart_' + eventSuffix, {
                detail: evtData
            });
            document.dispatchEvent(evt);
        }
        if (overrideCallback) {
            overrideCallback(response);
        }
    };
    return cb;
};

//======================================================================================================
// Export autochart global singleton and replay queued async methods
//======================================================================================================
var autochart = new Tracker();
module.exports = autochart;
if (window) {

    //Copy queued methods
    var queued = window.autochart || [];

    //Replace stubbed autochart global with real singleton instance + utils instance
    window.autochart = autochart;
    window.autochart.util = Utils;

    //Replay any queued methods
    while (queued.length > 0) {
        var args = queued.shift();
        var method = args.shift();
        if (autochart[method]) {
            autochart[method].apply(autochart, args);
        }
    }

    //Export tracker library for testing
    window.AutoChartTracker = Tracker;
}