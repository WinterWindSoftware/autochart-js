// Check if logging is enabled in 'autochartLogging' localStorage
const LOG_ENABLED = console && localStorage && localStorage.getItem
    && localStorage.getItem('autochartLogging');

function log(msg, data) {
    /* eslint no-console:0 */
    if (LOG_ENABLED) {
        console.log(`[autochart] ${msg}`);
        if (data && console.dir) {
            console.dir(data);
        }
    }
}

function prevent(e) {
    const evt = e || window.event;
    if (evt.preventDefault) {
        return evt.preventDefault();
    }
    evt.returnValue = false;
    return evt.returnValue;
}

export default {
    log,
    error: (msg) => {
        /* eslint no-console:0 */
        if (LOG_ENABLED) {
            console.error(`[autochart] ${msg}`);
        }
    },
    prevent,
    isFunction: obj => typeof (obj) === 'function',
    callAsync: (fn, wait) => {
        if (typeof fn !== 'function') {
            return;
        }
        log(`Calling func in ${wait || 0}ms...`);
        if (!wait) {
            setTimeout(fn, 0);
        } else {
            setTimeout(fn, wait);
        }
    },
    // This converts querystring string to a key-value object
    getQueryParameters: () => {
        if (!document.location.search) {
            return {};
        }
        return document.location.search.replace(/(^\?)/, '').split('&').map(function convert(n) {
            /* eslint no-param-reassign:0 */
            n = n.split('=');
            this[n[0]] = n[1];
            return this;
        }.bind({}))[0];
    },
    // For ASP.NET webforms only
    aspnet: {
        beforePostbackAsync: (triggerControlId, handler) => {
            if (!handler) {
                log('No handler defined for beforePostbackAsync');
                return;
            }
            /* jshint camelcase:false */
            let origPostBackHandler;
            if (typeof window.WebForm_DoPostBackWithOptions === 'function') {
                // First ensure that the rawEvent is passed into the onclick
                //  handler of the trigger control so that it can be paused and resumed.
                // We want to rewrite the following onclick attribute:
                //      javascript:WebForm_DoPostBackWithOptions(new WebForm_PostBackOptions(
                //            "MyAppFormSubmit1$Submit","",true,"MyApp","",false,false))"
                // to be:
                //      javascript:WebForm_DoPostBackWithOptions(new WebForm_PostBackOptions(
                //            "MyAppFormSubmit1$Submit","",true,"MyApp","",false,false),event)"
                const triggerButton = triggerControlId ? document.getElementById(
                    triggerControlId.replace(/\\\$/, '_')) : null;
                if (triggerButton && triggerButton.getAttribute('onclick')) {
                    log(`Appending to onclick attribute for ${triggerControlId}`);
                    triggerButton.setAttribute('onclick',
                        triggerButton.getAttribute('onclick').replace(/\)$/, ',event)'));
                }

                // Now Wrap postback handler
                origPostBackHandler = window.WebForm_DoPostBackWithOptions;
                window.WebForm_DoPostBackWithOptions = (postBackOptions, rawEvent) => {
                    postBackOptions = postBackOptions || {};
                    log('Calling wrapped WebForm_DoPostBackWithOptions...');
                    // Run the handler
                    if (postBackOptions.eventTarget && (!triggerControlId ||
                        new RegExp(`${triggerControlId}$`).test(postBackOptions.eventTarget))) {
                        log('Intercepting postback, first checking if validation needs performed...');
                        if (postBackOptions.validation && typeof (window.Page_ClientValidate) === 'function') {
                            window.Page_ClientValidate(postBackOptions.validationGroup);
                        }
                        if (!postBackOptions.validation || window.Page_IsValid) {
                            log('Preventing standard postback...');
                            prevent(rawEvent);
                            log('Invoking custom postback handler...');
                            handler(() => {
                                log('Invoking window.__doPostBack...');
                                /* eslint no-underscore-dangle:0 */
                                if (window.__doPostBack) {
                                    window.__doPostBack(
                                        postBackOptions.eventTarget, postBackOptions.eventArgument);
                                }
                            });
                        }
                    } else {
                        log('Postback triggered by unwatched control. Just doing standard postback...');
                        // Some other button triggered postback that we don't care about
                        origPostBackHandler(postBackOptions);
                    }
                    return false;
                };
            } else {
                log('window.WebForm_DoPostBackWithOptions not found.');
            }
        }
    }
};
