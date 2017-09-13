import _extend from 'lodash/extend';
import _includes from 'lodash/includes';
import './polyfills';
import config from './Config';
import EventDispatcher from './event-dispatcher';
import BrowserContext from './BrowserContext';
import Utils from './Utils';

const disabledAccounts = config.disabledAccounts;

const ACTIONS_COLLECTION = 'VisitorActions';
const TAGS_COLLECTION = 'VisitorTags';

/**
 * Tracking API instance.
 * @constructor
 */

function Tracker() {}

// @accountKey: String
// @context: { session: { visitorId, sessionId, referrer, userAgent, startTime }, page: { url} }

/**
 * Initialise the Tracker with account key and custom options.
 * @param  {string} accountKey - unique tracking key for your AutoChart account. Required.
 * @param  {object} options - Array of options to override certain tracking behaviour
 * @param  {BrowserContext} browserContext - used to access browser data (DOM, URL, cookies)
 */
Tracker.prototype.init = function init(accountKey, options, browserContext) {
    if (!accountKey) {
        throw new Error('accountKey must be specified');
    }
    if (typeof accountKey !== 'string' || accountKey.length !== 24) {
        throw new Error('Invalid account key. It must be a 24 character long string.');
    }
    if (options) {
        this.options = options;
        Utils.log(`Initilised with options: ${JSON.stringify(options)}`);
    } else {
        this.options = {};
    }
    this.timeout = 1000;
    this.trackingDisabled = (window.AUTOCHART_DISABLED === true)
        || _includes(disabledAccounts, accountKey);
    if (this.trackingDisabled) {
        Utils.log('Tracking disabled. No events will be sent');
    }
    const context = browserContext || new BrowserContext(window);
    this.dispatcher = new EventDispatcher(accountKey);

    // =============================================================================================
    // INIT
    // =============================================================================================

    // Setup global properties to be sent with all events on this page
    this.globalProperties = {
        session: context.session,
        urlRaw: context.page.url,
        pageTitle: context.page.title,
        dayOfWeek: (context.page.timestamp && context.page.timestamp.getDay) ?
            context.page.timestamp.getDay() : new Date().getDay(),
        timestamp: context.page.timestamp || undefined
    };
    this.globalProperties.session.customerAccountId = accountKey;
    this.globalProperties.session.userAgentRaw = context.session.userAgentRaw;
    this.globalProperties.session.ipAddress = context.session.ipAddress;

    // Send pageview event on load
    this.page();
};

// =============================================================================================
// TRACKING API FUNCTIONS
// =============================================================================================
/**
 * Send a 'PageView' VisitorAction event. Automatically called in init so not usually required.
 * @param  {function(err, response)} done - callback fired when event completes
 */
Tracker.prototype.page = function page(done) {
    return this.trackVisitorAction('PageView', null, null, done);
};

/**
 * Send a 'VehicleView' VisitorAction event for a specific vehicle.
 * @param  {Vehicle} vehicle
 * @param  {Date} timestamp - time the event was sent. If not specified, defaults to Date.now().
 * @param  {function(err, response)} done - callback fired when event completes
 */
Tracker.prototype.trackVehicleView = function trackVehicleView(vehicle, timestamp, done) {
    return this.trackVisitorAction('VehicleView', {
        vehicles: [vehicle]
    }, timestamp, done);
};

/**
 * Send a 'VehicleAction' VisitorAction event for a specific vehicle.
 * @param  {Vehicle} vehicle
 * @param  {string} actionCategory - category of the action, e.g. 'Save', 'Compare', 'Print'
 * @param  {Date} timestamp - time the event was sent. If not specified, defaults to Date.now().
 * @param  {function(err, response)} done - callback fired when event completes
 */
Tracker.prototype.trackVehicleAction = function trackVehicleAction(vehicle, actionCategory,
    timestamp, done) {
    return this.trackVisitorAction('VehicleAction', {
        vehicles: [vehicle],
        actionCategory
    },
    timestamp, done);
};

/**
 * Sends a 'Search' VisitorAction event for a specific vehicle.
 * @param  {SearchCriteria} searchCriteria - criteria used to do the search.
 * @param  {Date} timestamp - time the event was sent. If not specified, defaults to Date.now().
 * @param  {function(err, response)} done - callback fired when event completes
 */
Tracker.prototype.trackSearch = function trackSearch(searchCriteria, timestamp, done) {
    return this.trackVisitorAction('Search', {
        searchCriteria
    }, timestamp, done);
};

/**
 * Sends a 'VisitIntent' VisitorAction event for a specific vehicle.
 * @param  {string} intentAction
 * @param  {Date} timestamp - time the event was sent. If not specified, defaults to Date.now().
 * @param  {function(err, response)} done - callback fired when event completes
 */
Tracker.prototype.trackVisitIntent = function trackVisitIntent(intentAction, timestamp, done) {
    return this.trackVisitorAction('VisitIntent', {
        intentAction
    }, timestamp, done);
};

/**
 * Sends a Tag event with one or more tags.
 * @param  {[string]} tags - array of tags to associate with this visitor. Required.
 * @param  {function(err, response)} done - callback fired when event completes
 */
Tracker.prototype.tag = function tag(tags, done) {
    if (this.trackingDisabled) {
        return false;
    }
    this.ensureInit();
    if (!tags) {
        throw new Error('tags parameter must be specified');
    }
    const tagsArray = (tags instanceof Array) ? tags : [tags.toString()];
    // Sanitize tags (strip out non alphanumeric plus space dash underscore)
    for (let i = 0; i < tagsArray.length; i += 1) {
        tagsArray[i] = tagsArray[i].toString().replace(/[^\w\s-]/gi, '');
    }
    const actionData = this.mergeGlobalProps({
        tags: tagsArray
    });
    Utils.log('Tag tracked', tags);
    return this.dispatcher.addEvent(TAGS_COLLECTION, actionData, done);
};


/**
 * Sends a Lead event after visitor has performed an action such as submitting an enquiry form.
 * @param  {Lead} lead
 * @param  {Date} timestamp - time the event was sent. If not specified, defaults to Date.now().
 * @param  {function(err, response)} done - callback fired when event completes
 */
Tracker.prototype.trackLead = function trackLead(lead, timestamp, done) {
    if (this.trackingDisabled) {
        return false;
    }
    this.ensureInit();
    if (!lead) {
        throw new Error('Lead must be specified');
    }
    const data = this.mergeGlobalProps({
        channel: lead.channel,
        subject: lead.subject,
        contact: lead.contact,
        message: lead.message,
        vehicle: lead.vehicle,
        recipient: lead.recipient
    }, timestamp);
    Utils.log('Lead tracked', lead);
    return this.dispatcher.addEvent('Leads', data, done);
};

/**
 * Tells the Tracker to send a lead event whenever a form is submitted.
 * @param  {HTMLElement} form - <form> node
 * @param  {function} leadFunction - function which will be evaluated when the form is submitted.
 *          It must return a Lead object which will then be sent to AutoChart.
 * @param  {function} hasValidationErrors - optionally provide function which returns true if
 *          validation errors are present. If so, lead will not be tracked.
 * @param  {Date} timestamp - time the event was sent. If not specified, defaults to Date.now().
 * @param  {function(err, response)} done - callback fired when event completes
 */
Tracker.prototype.trackLeadForm = function trackLeadForm(form, leadFunction,
    hasValidationErrors, timestamp, done) {
    if (this.trackingDisabled) {
        return false;
    }
    const self = this;
    self.ensureInit();
    if (!leadFunction || !Utils.isFunction(leadFunction)) {
        throw new Error('A function must be specified to return the lead data when the form is submitted.');
    }
    if (form) {
        Utils.log('Wiring up submit handler');
        const handler = function handler(e) {
            // First check for validation errors
            if (hasValidationErrors && hasValidationErrors(form)) {
                Utils.log('Validation errors detected. Lead not tracked');
                return;
            }
            Utils.log('Handler fired. Preventing default submit...');
            Utils.prevent(e);
            const lead = leadFunction();
            // Track the lead
            self.trackLead(lead, timestamp, done);
            // Proceed with submitting the form
            if (!self.options.preventFormSubmits) {
                self.callback(() => {
                    form.submit();
                });
            } else {
                Utils.log('Preventing submit of form.');
            }
        };
        // Wire up submit handler (preferably via jquery)
        const $ = window.jQuery || window.Zepto;
        if ($) {
            $(form).submit(handler);
        } else if (form.addEventListener) {
            form.addEventListener('submit', handler, false);
        } else if (form.attachEvent) {
            form.attachEvent('onsubmit', handler);
        }
    }
    return true;
};

Tracker.prototype.trackLeadFormAspNet = function trackLeadFormAspNet(options = {},
    leadFunction, timestamp, done) {
    if (this.trackingDisabled) {
        return false;
    }
    const self = this;
    self.ensureInit();
    if (!leadFunction || !Utils.isFunction(leadFunction)) {
        throw new Error('A function must be specified to return the lead data when the form is submitted.');
    }
    Utils.aspnet.beforePostbackAsync(options.submitButtonId, (doPostback) => {
        const lead = leadFunction();
        self.trackLead(lead, timestamp, done);
        self.callback(() => {
            doPostback();
        });
    });
    return true;
};

/**
 * Sends a 'Finance' VisitorAction event, with finance data.
 * @param  {Finance} financeData - financial data to save. Required.
 * @param  {[type]} vehicle     - vehicle to which finance action was related
 * @param  {Date} timestamp - time the event was sent. If not specified, defaults to Date.now().
 * @param  {function(err, response)} done - callback fired when event completes
 */
Tracker.prototype.trackFinance = function trackFinance(financeData, vehicle, timestamp, done) {
    if (!financeData) {
        throw new Error('financeData object must be specified');
    }
    return this.trackVisitorAction('Finance', {
        finance: financeData,
        vehicles: [vehicle]
    }, timestamp, done);
};

/**
 * Calls specified function whenever the library has asynchronously loaded.
 * @param  {Function} callback function to call
 */
Tracker.prototype.ready = function ready(callback) {
    if (callback && Utils.isFunction(callback)) {
        callback();
    }
};


// =============================================================================================
// PRIVATES
// =============================================================================================

Tracker.prototype.ensureInit = function ensureInit() {
    if (!this.globalProperties.session.customerAccountId) {
        throw new Error('init() must be called before calling this method.');
    }
};

Tracker.prototype.trackVisitorAction = function trackVisitorAction(actionType, data,
    timestamp, done) {
    if (this.trackingDisabled) {
        return false;
    }
    this.ensureInit();
    const actionData = this.mergeGlobalProps(data || {}, timestamp);
    actionData.actionType = actionType;
    Utils.log(`VisitorAction tracked: ${actionType}`, data);
    return this.dispatcher.addEvent(ACTIONS_COLLECTION, actionData, done);
};

Tracker.prototype.mergeGlobalProps = function mergeGlobalProps(eventData, timestamp) {
    const merged = _extend({}, this.globalProperties, eventData);
    if (timestamp) {
        merged.timestamp = eventData.timestamp;
    }
    return merged;
};

Tracker.prototype.callback = function callback(fn) {
    Utils.callAsync(fn, this.timeout || 1000);
    return this;
};

// ============================================================================================
// Export autochart global singleton and replay queued async methods
// ============================================================================================
const autochart = new Tracker();
module.exports = autochart;
if (window) {
    // Copy queued methods
    const queued = window.autochart || [];

    // Replace stubbed autochart global with real singleton instance + utils instance
    window.autochart = autochart;
    window.autochart.util = Utils;

    // Replay any queued methods
    while (queued.length > 0) {
        const args = queued.shift();
        const method = args.shift();
        if (autochart[method]) {
            autochart[method](...args);
        }
    }

    // Export tracker library for testing
    window.AutoChartTracker = Tracker;
}
