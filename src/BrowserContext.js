const Cookies = require('cookies-js');
const ObjectId = require('./lib/objectid');

function BrowserContext(window) {
    const self = this;

    self.page = {};
    self.session = {};

    const SESSION_COOKIE = 'ac_session';
    const PERMANENT_COOKIE = 'ac_visitor';
    const SESSION_DURATION_MINS = 30;
    Cookies.defaults = {
        path: '/'
    };

    //= ======================================================
    // HELPERS
    //= ======================================================

    function serializeCookie(obj) {
        // TODO: need to url encode here possibly
        return obj ? JSON.stringify(obj) : null;
    }

    function deserializeCookie(str) {
        if (!str) {
            return undefined;
        }
        // TODO: need to url decode here possibly
        return JSON.parse(str);
    }

    function generateUniqueId() {
        return new ObjectId().toString();
    }

    //= ======================================================
    // COOKIE SETUP
    //= ======================================================

    // Set the amount of time a session should last.
    const sessionExpireTime = new Date();
    sessionExpireTime.setMinutes(sessionExpireTime.getMinutes() + SESSION_DURATION_MINS);

    // Check if we have a session cookie
    // If it is undefined, set a new one.
    let sessionCookieVal = deserializeCookie(Cookies.get(SESSION_COOKIE));
    if (!sessionCookieVal) {
        sessionCookieVal = {
            id: generateUniqueId(),
            startTime: new Date()
        };
        Cookies.set(SESSION_COOKIE, serializeCookie(sessionCookieVal), {
            expires: sessionExpireTime
        });
    } else {
        // If it does exist, delete it and set a new one with new expiration time
        Cookies.expire(SESSION_COOKIE);
        Cookies.set(SESSION_COOKIE, serializeCookie(sessionCookieVal), {
            expires: sessionExpireTime
        });
    }

    let permanentCookieVal = deserializeCookie(Cookies.get(PERMANENT_COOKIE));

    // If it is undefined, set a new one.
    if (!permanentCookieVal) {
        permanentCookieVal = {
            id: generateUniqueId()
        };
        Cookies.set(PERMANENT_COOKIE, serializeCookie(permanentCookieVal), {
            expires: 60 * 60 * 24 * 365 * 10 // 10 years in seconds
        });
    }

    //= ======================================================
    // populate page and session
    // session: { visitorId, sessionId, referrer, userAgent, startTime }, page: { url} }
    //= ======================================================
    self.session.visitorId = permanentCookieVal.id;
    self.session.sessionId = sessionCookieVal.id;
    self.session.startTime = sessionCookieVal.startTime;
    self.session.referrerRaw = window.document.referrer;
    self.session.userAgentRaw = window.navigator.userAgent;
    self.page.url = window.document.URL;
    self.page.title = window.document.title;
}

module.exports = BrowserContext;
