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
    if(!document.location.search) {
        return {};
    }
    return document.location.search.replace(/(^\?)/, '').split('&').map(function(n) {
        n = n.split('=');
        this[n[0]] = n[1];
        return this;
    }.bind({}))[0];
};

module.exports = Utils;