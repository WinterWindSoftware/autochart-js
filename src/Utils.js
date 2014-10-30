var Utils = {};

Utils.log = function(msg) {
    if (console) {
        console.log('[autochart] ' + msg);
    }
};
Utils.error = function(msg) {
    if (console) {
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
        return;
    }
    /*jshint camelcase:false */
    var origPostBackHandler;
    if (typeof window.WebForm_DoPostBackWithOptions === 'function') {
        //Wrap postback handler
        origPostBackHandler = window.WebForm_DoPostBackWithOptions;
        window.WebForm_DoPostBackWithOptions = function(postBackOptions) {
            postBackOptions = postBackOptions || {};
            //Run the handler                                
            if (postBackOptions.eventTarget && (!triggerControlId || new RegExp(triggerControlId + '$').test(postBackOptions.eventTarget))) {
                if (postBackOptions.validation && typeof(Page_ClientValidate) === 'function') {
                    window.Page_ClientValidate();
                }
                if (!postBackOptions.validation || window.Page_IsValid) {
                    Utils.prevent();
                    handler(function() {
                        if (window.__doPostBack) {
                            window.__doPostBack(postBackOptions.eventTarget, postBackOptions.eventArgument);
                        }
                    });
                }
            } else {
                //Some other button triggered postback that we don't care about
                origPostBackHandler(postBackOptions);
            }
            return false;
        };
    }
};

module.exports = Utils;