autochart-js
=================

JavaScript API for AutoChart.io tracking

## Loading Custom client binding scripts
The following snippet should load the autochart.track.min.js file and a separate external js file containing site-specific hook-up logic. Both files are loaded asynchronously.
The snippet should be added immediately before the closing `</head>` tag on the page.

```html

<script type="text/javascript">
//Async Loader script
window.autochart=window.autochart||[],window.autochart.methods=["init","page","trackVehicleView","trackSearch","trackVisitIntent","tag","trackLead","trackLeadForm","trackVehicleAction"],window.autochart.factory=function(a){return function(){var b=Array.prototype.slice.call(arguments);return b.unshift(a),window.autochart.push(b),window.autochart}};for(var i=0;i<window.autochart.methods.length;i++){var method=window.autochart.methods[i];window.autochart[method]=window.autochart.factory(method)}window.autochart.load=function(a,b){var c=document.createElement("script");c.type="text/javascript",c.async=!0,c.src="https://portal.autochart.io/scripts/autochart.track.min.js?v="+b;var d=document.getElementsByTagName("script")[0];d.parentNode.insertBefore(c,d),window.autochart.init(a)},window.autochart.SDK_VERSION="0.4.3",/*! 
  Replace <YourCustomerAccountIdHere> below with your customer API customerKey
*/
window.autochart.load("<YourCustomerAccountIdHere>",window.autochart.SDK_VERSION);
</script>
<!-- Replace the filename below with the path to your custom script -->
<script type="text/javascript" src="https://portal.autochart.io/scripts/clientsites/<clientname>.min.js" async></script>

```
