# autochart-tracker

A client-side JavaScript API for tracking automotive website events with [Autochart.io](https://autochart.io).

## Pre-Requisite
Login to the [Autochart portal](https://portal.autochart.io) and get the **Tracking Key** from your account's settings page.

## Installation
### Hosted CDN
This is the recommended approach if you are building the tracking implementation yourself rather than having the Autochart dev team implement it for you.

Add the following snippet immediately before the closing `</head>` tag on each page of your site. It will download the `autochart.track.min.js` file asynchronously from the Autochart CDN (so it will be fast and won't block your page from loading in the meantime).
Make sure to update `<YourCustomerAccountIdHere>` with your account's Tracking Key.

```html

<script type="text/javascript">
window.autochart=window.autochart||[],window.autochart.methods=["init","page","trackVehicleView","trackSearch","trackVisitIntent","tag","trackLead","trackLeadForm","trackVehicleAction","trackFinance","ready","trackLeadFormAspNet"],window.autochart.factory=function(a){return function(){var b=Array.prototype.slice.call(arguments);return b.unshift(a),window.autochart.push(b),window.autochart}};for(var i=0;i<window.autochart.methods.length;i++){var method=window.autochart.methods[i];window.autochart[method]=window.autochart.factory(method)}window.autochart.load=function(a){var b=document.createElement("script");b.type="text/javascript",b.async=!0,b.src="https://cdn.autochart.io/tracker/v1/autochart.track.min.js";var c=document.getElementsByTagName("script")[0];c.parentNode.insertBefore(b,c),window.autochart.init(a)},
/*!
  Replace <YourCustomerAccountIdHere> below with your customer API tracking key
*/
window.autochart.load("<YourCustomerAccountIdHere>");
</script>

```

### As an NPM module (advanced)
To reference the library as part of a commonjs style package, first install it:

```
npm install autochart-tracker --save
```

then import it:

```
var acTracker = require('autochart-tracker');
acTracker.init('<YourCustomerAccountIdHere>');
```

## Usage
Add calls to `autochart.track*` functions to send event data to Autochart.

## Disabling Tracking
If you need to disable tracking on a website which already has Autochart tracking hooks in place, you should insert the following line of code at the top of your tracking snippet (as the first line inside your `<script>` tag):

```javascript
window.AUTOCHART_DISABLED = true;
```

This will prevent any events from being sent to the Autochart servers.

## Developer Guide
Check out [the wiki](https://github.com/WinterWindSoftware/autochart-tracker/wiki) for more details on building a tracking implementation with Autochart.

## Support
If you need help with anything, drop us an email at [support@autochart.io](mailto:support@autochart.io) and we'll be happy to help out.

---
## Internal Development
The sections below are for developers working on this library.

## Testing
To run tests for this library:
```
npm start
```
Open browser to http://localhost:8080/test.
This will run the mocha tests in the browser.
