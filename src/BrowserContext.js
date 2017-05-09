var Cookies = require('cookies-js');
var ObjectId = require('./lib/objectid');

function BrowserContext(window) {
    var self = this;

    self.page = {};
    self.session = {};

    var SESSION_COOKIE = 'ac_session';
    var PERMANENT_COOKIE = 'ac_visitor';
    var SESSION_DURATION_MINS = 30;
    Cookies.defaults = {
        path: '/'
    };

    //=======================================================
    // HELPERS
    //=======================================================

    function serializeCookie(obj) {
        if (obj) {
            //TODO: need to url encode here possibly
            return JSON.stringify(obj);
        }
    }

    function deserializeCookie(str) {
        if (!str) {
            return undefined;
        }
        //TODO: need to url decode here possibly
        return JSON.parse(str);
    }

    function generateUniqueId() {
        return new ObjectId().toString();
    }

    //=======================================================
    // COOKIE SETUP
    //=======================================================

    //Set the amount of time a session should last.
    var sessionExpireTime = new Date();
    sessionExpireTime.setMinutes(sessionExpireTime.getMinutes() + SESSION_DURATION_MINS);

    //Check if we have a session cookie
    //If it is undefined, set a new one.
    var sessionCookieVal = deserializeCookie(Cookies.get(SESSION_COOKIE));
    if (!sessionCookieVal) {
        sessionCookieVal = {
            id: generateUniqueId(),
            startTime: new Date()
        };
        Cookies.set(SESSION_COOKIE, serializeCookie(sessionCookieVal), {
            expires: sessionExpireTime
        });
    }
    //If it does exist, delete it and set a new one with new expiration time
    else {
        Cookies.expire(SESSION_COOKIE);
        Cookies.set(SESSION_COOKIE, serializeCookie(sessionCookieVal), {
            expires: sessionExpireTime
        });
    }

    var permanentCookieVal = deserializeCookie(Cookies.get(PERMANENT_COOKIE));

    //If it is undefined, set a new one.
    if (!permanentCookieVal) {
        permanentCookieVal = {
            id: generateUniqueId()
        };
        Cookies.set(PERMANENT_COOKIE, serializeCookie(permanentCookieVal), {
            expires: 60 * 24 * 365 * 10 //10 years in minutes
        });
    }

    //=======================================================
    // populate page and session
    //session: { visitorId, sessionId, referrer, userAgent, startTime }, page: { url} }
    //=======================================================
    self.session.visitorId = permanentCookieVal.id;
    self.session.sessionId = sessionCookieVal.id;
    self.session.startTime = sessionCookieVal.startTime;
    self.session.referrerRaw = window.document.referrer;
    self.session.userAgentRaw = window.navigator.userAgent;
    self.page.url = window.document.URL;
    self.page.title = window.document.title;
}

module.exports = BrowserContext;