const Utils = {};

// Check if logging is enabled in 'autochartLogging' localStorage
if (console && localStorage && localStorage.getItem && localStorage.getItem('autochartLogging')) {
    Utils.logEnabled = true;
}

Utils.log = function (msg, data) {
    if (Utils.logEnabled) {
        console.log(`[autochart] ${msg}`);
        if (data && console.dir) {
            console.dir(data);
        }
    }
};
Utils.error = function (msg) {
    if (Utils.logEnabled) {
        console.error(`[autochart] ${msg}`);
    }
};

Utils.prevent = function (e) {
    e = e || window.event;
    return e.preventDefault ? e.preventDefault() : e.returnValue = false;
};

Utils.isFunction = function (obj) {
    return typeof (obj) === 'function';
};

Utils.callAsync = function (fn, wait) {
    if (typeof fn !== 'function') {
        return;
    }
    Utils.log(`Calling func in ${wait || 0}ms...`);
    if (!wait) {
        return setTimeout(fn, 0);
    }
    setTimeout(fn, wait);
};

Utils._extend = function (target) {
    for (let i = 1; i < arguments.length; i++) {
        for (const prop in arguments[i]) {
            // if ((target[prop] && _type(target[prop]) == 'Object') && (arguments[i][prop] && _type(arguments[i][prop]) == 'Object')){
            target[prop] = arguments[i][prop];
        }
    }
    return target;
};

Utils.includes = function (collection, value) {
    if (!collection || !Array.isArray(collection)) {
        return false;
    }
    return collection.indexOf(value) >= 0;
};

// This converts querystring string to a key-value object
Utils.getQueryParameters = function () {
    if (!document.location.search) {
        return {};
    }
    return document.location.search.replace(/(^\?)/, '').split('&').map(function (n) {
        n = n.split('=');
        this[n[0]] = n[1];
        return this;
    }.bind({}))[0];
};


// For ASP.NET webforms only
Utils.aspnet = {};
// Adds a function which runs when a postback is triggered by specified controlId
// It works by intercepting calls to WebForm_DoPostBackWithOptions
Utils.aspnet.beforePostbackAsync = function (triggerControlId, handler) {
    if (!handler) {
        Utils.log('No handler defined for beforePostbackAsync');
        return;
    }
    /* jshint camelcase:false */
    let origPostBackHandler;
    if (typeof window.WebForm_DoPostBackWithOptions === 'function') {
        // First ensure that the rawEvent is passed into the onclick handler of the trigger control
        // so that it can be paused and resumed.
        // We want to rewrite the following onclick attribute:
        //      javascript:WebForm_DoPostBackWithOptions(new WebForm_PostBackOptions("MyAppFormSubmit1$Submit", "", true, "MyApp", "", false, false))"
        // to be:
        //      javascript:WebForm_DoPostBackWithOptions(new WebForm_PostBackOptions("MyAppFormSubmit1$Submit", "", true, "MyApp", "", false, false), event)"
        // COGFormSubmit1\\$Submit
        // COGFormSubmit1_Submit
        const triggerButton = triggerControlId ? document.getElementById(triggerControlId.replace(/\\\$/, '_')) : null;
        if (triggerButton && triggerButton.getAttribute('onclick')) {
            Utils.log(`Appending to onclick attribute for ${triggerControlId}`);
            triggerButton.setAttribute('onclick', triggerButton.getAttribute('onclick').replace(/\)$/, ',event)'));
        }

        // Now Wrap postback handler
        origPostBackHandler = window.WebForm_DoPostBackWithOptions;
        window.WebForm_DoPostBackWithOptions = function (postBackOptions, rawEvent) {
            postBackOptions = postBackOptions || {};
            Utils.log('Calling wrapped WebForm_DoPostBackWithOptions...');
            // Run the handler
            if (postBackOptions.eventTarget && (!triggerControlId || new RegExp(`${triggerControlId}$`).test(postBackOptions.eventTarget))) {
                Utils.log('Intercepting postback, first checking if validation needs performed...');
                if (postBackOptions.validation && typeof (window.Page_ClientValidate) === 'function') {
                    window.Page_ClientValidate(postBackOptions.validationGroup);
                }
                if (!postBackOptions.validation || window.Page_IsValid) {
                    Utils.log('Preventing standard postback...');
                    Utils.prevent(rawEvent);
                    Utils.log('Invoking custom postback handler...');
                    handler(() => {
                        Utils.log('Invoking window.__doPostBack...');
                        if (window.__doPostBack) {
                            window.__doPostBack(postBackOptions.eventTarget, postBackOptions.eventArgument);
                        }
                    });
                }
            } else {
                Utils.log('Postback triggered by unwatched control. Just doing standard postback...');
                // Some other button triggered postback that we don't care about
                origPostBackHandler(postBackOptions);
            }
            return false;
        };
    } else {
        Utils.log('window.WebForm_DoPostBackWithOptions not found.');
    }
};

module.exports = Utils;
