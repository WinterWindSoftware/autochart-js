# autochart-js

A client-side JavaScript API for tracking automotive website events with [AutoChart.io](https://autochart.io).

## Pre-Requisite
Login to the [AutoChart portal](https://portal.autochart.io) and get the **Tracking Key** from your account's settings page.

## Installation
Add the following snippet immediately before the closing `</head>` tag on each page of your site. It will download the `autochart.track.min.js` file asynchronously from the AutoChart CDN (so it will be fast and won't block your page from loading in the meantime).
Make sure to update `<YourCustomerAccountIdHere>` with your account's Tracking Key.

```html

<script type="text/javascript">
window.autochart=window.autochart||[],window.autochart.methods=["init","page","trackVehicleView","trackSearch","trackVisitIntent","tag","trackLead","trackLeadForm","trackVehicleAction"],window.autochart.factory=function(a){return function(){var b=Array.prototype.slice.call(arguments);return b.unshift(a),window.autochart.push(b),window.autochart}};for(var i=0;i<window.autochart.methods.length;i++){var method=window.autochart.methods[i];window.autochart[method]=window.autochart.factory(method)}window.autochart.load=function(a,b){var c=document.createElement("script");c.type="text/javascript",c.async=!0,c.src="https://az578655.vo.msecnd.net/tracker/"+b+"/autochart.track.min.js";var d=document.getElementsByTagName("script")[0];d.parentNode.insertBefore(c,d),window.autochart.init(a)},window.autochart.SDK_VERSION="0.5.3",/*!
  Replace <YourCustomerAccountIdHere> below with your customer API tracking key
*/
window.autochart.load("<YourCustomerAccountIdHere>",window.autochart.SDK_VERSION);
</script>

```

## Usage
Add calls to `autochart.track*` functions to send event data to AutoChart.
TODO: add usage examples

## Support
If you need help with anything, drop us an email at [support@autochart.io](mailto:support@autochart.io) and we'll be happy to help out.
