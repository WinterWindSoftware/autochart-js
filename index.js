import Tracker from './src/tracker';
import Utils from './src/utils';

const autochart = new Tracker();
// Replay queued async methods
if (window) {
    // Copy queued methods
    const queued = window.autochart || [];

    // Replace stubbed autochart global with real singleton instance + utils instance
    window.autochart = autochart;
    window.autochart.util = Utils;

    // Replay any queued methods
    while (queued.length > 0) {
        const args = queued.shift();
        const method = args.shift();
        if (autochart[method]) {
            autochart[method](...args);
        }
    }

    // Export tracker library for testing
    window.AutoChartTracker = Tracker;
}

export default autochart;
