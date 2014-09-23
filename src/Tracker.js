'use strict';
//Imports
var config = require('./Config');
var KeenTrack = require('../bower_components/keen-js/dist/keen-tracker.js');
var BrowserContext = require('./BrowserContext');
var Utils = require('./Utils');

//Consts
var ACTIONS_COLLECTION = 'VisitorActions';
var TAGS_COLLECTION = 'VisitorTags';

//ctor

function Tracker() {}

//@accountKey: String
//@context: { session: { visitorId, sessionId, referrer, userAgent, startTime }, page: { url} }
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
    this._timeout = 300;
    context = context || new BrowserContext(window);
    this.dispatcher = new KeenTrack(config.keen);


    // =============================================================================================
    // INIT
    // =============================================================================================

    //Setup global properties to be sent with all events on this page
    this._globalProperties = {
        session: context.session,
        url: Utils.getUrlObject(context.page.url),
        pageTitle: context.page.title,
        keen: {
            timestamp: context.page.timestamp || undefined
        }
    };
    if (context.session.ipAddress) {
        this._globalProperties.keen.addons = [{
            name: 'keen:ip_to_geo',
            input: {
                ip: 'session.ipAddress'
            },
            output: 'session.ipLocation'
        }];
    }
    this._globalProperties.session.customerAccountId = accountKey;
    //Overwrite user agent and referrer in session with parsed versions
    this._globalProperties.session.referrer = Utils.getUrlObject(context.session.referrer);
    this._globalProperties.session.userAgent = Utils.getUserAgentObject(context.session.userAgent);

    //Send pageview event on load
    this.page();
};

// =============================================================================================
// TRACKING API FUNCTIONS
// =============================================================================================
Tracker.prototype.page = function(success, error) {
    return this._trackVisitorAction('PageView', null, null, success, error);
};

Tracker.prototype.trackVehicleView = function(vehicle, timestamp, success, error) {
    return this._trackVisitorAction('VehicleView', {
        vehicles: [vehicle]
    }, timestamp, success, error);
};

Tracker.prototype.trackVehicleAction = function(vehicle, actionCategory, timestamp, success, error) {
    return this._trackVisitorAction('VehicleAction', {
        vehicles: [vehicle],
        actionCategory: actionCategory
    },
    timestamp, success, error);
};

Tracker.prototype.trackSearch = function(searchCriteria, timestamp, success, error) {
    return this._trackVisitorAction('Search', {
        searchCriteria: searchCriteria
    }, timestamp, success, error);
};

Tracker.prototype.trackVisitIntent = function(intentAction, timestamp, success, error) {
    return this._trackVisitorAction('VisitIntent', {
        intentAction: intentAction
    }, timestamp, success, error);
};

Tracker.prototype.tag = function(tags, success, error) {
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
    return this.dispatcher.addEvent(TAGS_COLLECTION, actionData, this._getEventCallback('Tag', success, actionData), this._getErrorCallback(error, actionData));
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

Tracker.prototype.trackLead = function(lead, timestamp, success, error) {
    this._ensureInit();
    if (!lead) {
        throw new Error('Lead must be specified');
    }
    var data = this._mergeGlobalProps({
        channel: lead.channel,
        subject: lead.subject,
        contact: lead.contact,
        message: lead.message,
        vehicle: lead.vehicle
    }, timestamp);
    return this.dispatcher.addEvent('Leads', data, this._getEventCallback('Lead', success, data), this._getErrorCallback(error, data));
};

Tracker.prototype.trackLeadForm = function(form, leadFunction, timestamp, success, error) {
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
                console.log('Preventing submit of form.');
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


// =============================================================================================
// PRIVATES
// =============================================================================================

Tracker.prototype._ensureInit = function() {
    if (!this._globalProperties.session.customerAccountId) {
        throw new Error('init() must be called before calling this method.');
    }
};

Tracker.prototype._trackVisitorAction = function(actionType, data, timestamp, success, error) {
    this._ensureInit();
    var actionData = this._mergeGlobalProps(data || {}, timestamp);
    actionData.actionType = actionType;
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
    Utils.callAsync(fn, this._timeout);
    return this;
};


//======================================================================================================
// Export autochart global singleton and replay queued async methods
//======================================================================================================
var autochart = new Tracker();
module.exports = autochart;
if (window) {
    //Replay any queued methods
    while (window.autochart && window.autochart.length > 0) {
        var args = window.autochart.shift();
        var method = args.shift();
        if (autochart[method]) {
            autochart[method].apply(autochart, args);
        }
    }

    //Replace stubbed autochart global with real singleton instance
    window.autochart = autochart;
    //Export tracker library for testing
    window.AutoChartTracker = Tracker;
}