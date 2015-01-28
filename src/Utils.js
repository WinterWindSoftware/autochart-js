var Utils = {};

//Check if logging is enabled in 'autochartLogging' localStorage
if(console && localStorage && localStorage.getItem && localStorage.getItem('autochartLogging')) {
    Utils.logEnabled = true;
}

Utils.log = function(msg) {
    if (Utils.logEnabled) {
        console.log('[autochart] ' + msg);
    }
};
Utils.error = function(msg) {
    if (Utils.logEnabled) {
        console.error('[autochart] ' + msg);
    }
};

Utils.prevent = function(e) {
    e = e || window.event;
    return e.preventDefault ? e.preventDefault() : e.returnValue = false;
};

Utils.isFunction = function(obj) {
    return typeof(obj) === 'function';
};

Utils.callAsync = function(fn, wait) {
    if ('function' !== typeof fn) {
        return;
    }
    Utils.log('Calling func in ' + (wait || 0) + 'ms...');
    if (!wait) {
        return setTimeout(fn, 0);
    }
    setTimeout(fn, wait);
};

Utils._extend = function(target) {
    for (var i = 1; i < arguments.length; i++) {
        for (var prop in arguments[i]) {
            // if ((target[prop] && _type(target[prop]) == 'Object') && (arguments[i][prop] && _type(arguments[i][prop]) == 'Object')){
            target[prop] = arguments[i][prop];
        }
    }
    return target;
};

//This converts querystring string to a key-value object
Utils.getQueryParameters = function() {
    if (!document.location.search) {
        return {};
    }
    return document.location.search.replace(/(^\?)/, '').split('&').map(function(n) {
        n = n.split('=');
        this[n[0]] = n[1];
        return this;
    }.bind({}))[0];
};


//For ASP.NET webforms only
Utils.aspnet = {};
//Adds a function which runs when a postback is triggered by specified controlId
//It works by intercepting calls to WebForm_DoPostBackWithOptions
Utils.aspnet.beforePostbackAsync = function(triggerControlId, handler) {
    if(!handler) {
        Utils.log('No handler defined for beforePostbackAsync');
        return;
    }
    /*jshint camelcase:false */
    var origPostBackHandler;
    if (typeof window.WebForm_DoPostBackWithOptions === 'function') {
        //Wrap postback handler
        origPostBackHandler = window.WebForm_DoPostBackWithOptions;
        window.WebForm_DoPostBackWithOptions = function(postBackOptions) {
            postBackOptions = postBackOptions || {};
            Utils.log('Calling wrapped WebForm_DoPostBackWithOptions...');
            //Run the handler                                
            if (postBackOptions.eventTarget && (!triggerControlId || new RegExp(triggerControlId + '$').test(postBackOptions.eventTarget))) {
                if (postBackOptions.validation && typeof(window.Page_ClientValidate) === 'function') {
                    window.Page_ClientValidate();
                }
                if (!postBackOptions.validation || window.Page_IsValid) {
                    Utils.log('Preventing standard postback...');
                    Utils.prevent();
                    Utils.log('Invoking custom postback handler...');
                    handler(function() {
                        Utils.log('Invoking window.__doPostBack...');
                        if (window.__doPostBack) {
                            window.__doPostBack(postBackOptions.eventTarget, postBackOptions.eventArgument);
                        }
                    });
                }
            } else {
                Utils.log('Postback triggered by unwatched control. Just doing standard postback...');
                //Some other button triggered postback that we don't care about
                origPostBackHandler(postBackOptions);
            }
            return false;
        };
    } else {
        Utils.log('window.WebForm_DoPostBackWithOptions not found.');
    }
};

module.exports = Utils;