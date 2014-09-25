// Snippet to asynchronously load the autochart.track.js library.
// Tracking methods are stubbed and calls to them are saved to be replayed later

window.autochart = window.autochart || [];

window.autochart.methods = [
    'init', 'page', 'trackVehicleView', 'trackSearch', 'trackVisitIntent', 'tag', 'trackLead', 'trackLeadForm', 'trackVehicleAction', 'trackFinance'
];
// Define a factory to create queue stubs. These are placeholders for the
// "real" methods in analytics.js so that you never have to wait for the library
// to load asynchronously to actually track things. The `method` is always the
// first argument, so we know which method to replay the call into.
window.autochart.factory = function (method) {
    return function () {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(method);
        window.autochart.push(args);
        return window.autochart;
    };
};

// For each of our methods, generate a queueing method.
for (var i = 0; i < window.autochart.methods.length; i++) {
    var method = window.autochart.methods[i];
    window.autochart[method] = window.autochart.factory(method);
}

// Define a method that will asynchronously load autochart.track.js
window.autochart.load = function (apiKey, sdkVersion) {
    // Create an async script element for analytics.js based on your API key.
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = '@@AUTOCHART_CDN_URL/' + sdkVersion + '/autochart.track.min.js';

    // Find the first script element on the page and insert our script next to it.
    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);
    window.autochart.init(apiKey);
};

// Add a version so we can keep track of what's out there in the wild.
window.autochart.SDK_VERSION = '@@AUTOCHART_SDK_VERSION';

/*!
  Replace <YourCustomerAccountIdHere> below with your customer API tracking key
*/
window.autochart.load('<YourCustomerAccountIdHere>', window.autochart.SDK_VERSION);