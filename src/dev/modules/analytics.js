import { SDK_VERSION } from "./consts.js";

export default function AnalyticsManager(YesGraphAPI) {
    var self = this;
    this.postponed = [];
    this.YesGraphAPI = YesGraphAPI;
    this.settings = { // default analytics event structure
        "context": {
            "app": {
                "name": window.navigator.appName,
                "version": window.navigator.appVersion
            },
            "library": {
                "name": "yesgraph.js",
                "version": SDK_VERSION
            },
            "device": {
                "type": "web"
            },
            "os": {},
            "userAgent": window.navigator.userAgent || null,
            "page": {
                "path": window.location.pathname,
                "referrer": window.document.referrer,
                "search": window.location.search,
                "title": window.document.title,
                "url": window.location.href
            },
        },
        "name": window.document.title + ': ' + window.location.pathname,
        "properties": {
            "app_name": null
        },
        "timestamp": new Date(),
        "type": "screen"
    };
    this.isReady = this.YesGraphAPI && this.YesGraphAPI.isReady;

    if (!this.isReady){
        // If the YesGraphAPI isn't yet installed/ready, any analytics
        // events can be stored in the "postponed" array. Once it IS ready,
        // we should POST all of those pending events.
        var interval = setInterval(function(){
            if (self.YesGraphAPI && self.YesGraphAPI.isReady) {
                clearInterval(interval);
                self.isReady = true;
                self.log(); // log all postponed events
            }
        }, 50);
    }

    this.log = function(type, target, timestamp, library) {
        var evt;
        if (type) {
            // Update the default event object with the specified data
            evt = jQuery.extend(true, {}, self.settings, { type: type });
            evt.target = target || evt.target;
            evt.timestamp = timestamp || evt.timestamp;
            evt.context.library = library || evt.context.library;
        }
        if (self.isReady) {
            // Log a breadcrumb to Sentry, in case an error occurs later
            if (self.YesGraphAPI.Raven) {
                self.YesGraphAPI.Raven.captureBreadcrumb({
                    timestamp: timestamp || new Date(),
                    message: type,
                    data: {
                        target: target
                    }
                });
            }
            // Collect all postponed events (in addition to the event
            // currently being logged), and send them in a batch to the API.
            var evts = [];
            if (evt) {
                evt.properties.app_name = self.YesGraphAPI.app;
                evts.push(evt);
            }
            self.postponed.forEach(function(evt) {
                evt.properties.app_name = self.YesGraphAPI.app;
                evts.push(evt);
            });
            if (evts.length > 0) {
                // Retry failed request up to 3 times, waiting 2000ms between tries
                self.YesGraphAPI.hitAPI("/analytics/sdk", "POST", { entries: evts }, null, 3, 2000);
            }
            self.postponed = [];
        } else {
            if (evt) {
                // Don't try to POST analytics events
                // before the YesGraphAPI object is ready
                self.postponed.push(evt);
            }
        }
    };
}
