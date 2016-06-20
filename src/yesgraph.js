/*!
 * YesGraph Javascript SDK __SDK_VERSION__
 *
 * https://www.yesgraph.com
 * https://docs.yesgraph.com/docs/javascript-sdk
 * 
 * Date: __BUILD_DATE__
 */

(function() {
    "use strict";

    var VERSION = "__SDK_VERSION__";
    var YESGRAPH_BASE_URL;
    var YESGRAPH_API_URL;
    var RUNNING_LOCALLY;
    var PUBLIC_RAVEN_DSN;
    var CLIENT_TOKEN_ENDPOINT = '/client-token';
    var ADDRBOOK_ENDPOINT = '/address-book';
    var SUGGESTED_SEEN_ENDPOINT = '/suggested-seen';
    var INVITES_SENT_ENDPOINT = '/invites-sent';
    var INVITES_ACCEPTED_ENDPOINT = '/invites-accepted';
    var ANALYTICS_ENDPOINT = '/analytics/sdk';
    var EVENTS = {
        LOAD_JS_SDK: "Loaded Javascript SDK",
        LOAD_DEFAULT_PARAMS: "Loaded Default CURRENT_USER Params",
        SAW_ERROR_MSG: "Saw Error Message"
    };
    var settings = {
        app: null,
        testmode: false,
        target: ".yesgraph-invites",
        contactImporting: true,
        promoteMatchingDomain: false,
        emailSending: true,
        inviteLink: true,
        shareBtns: true
    };
    var YesGraphAPI = new YesGraphAPIConstructor();

    // Initialize in dev-mode as appropriate
    if (["localhost", "lvh.me"].indexOf(window.location.hostname) !== -1 && window.document.title === 'YesGraph') {
        YESGRAPH_BASE_URL = "http://localhost:5001";
        PUBLIC_RAVEN_DSN = "https://26657ee86c48458ea5c65e27de766715@app.getsentry.com/81078";
        RUNNING_LOCALLY = true;
    } else {
        YESGRAPH_BASE_URL = "https://api.yesgraph.com";
        PUBLIC_RAVEN_DSN = "https://2f5e2b0beb494197b745f10f9fca6c9d@app.getsentry.com/79844";
        RUNNING_LOCALLY = false;
    }
    YESGRAPH_API_URL = YESGRAPH_BASE_URL + '/v0';

    // Don't load the widget twice
    if (!window.YesGraphAPI) {
        window.YesGraphAPI = YesGraphAPI;
        window.YesGraphAPIConstructor = YesGraphAPIConstructor;
    } else {
        YesGraphAPI.utils.error("YesGraph API has been loaded multiple times", true, true);
    }
    requireScript("jQuery", "https://code.jquery.com/jquery-2.1.1.min.js", function(jQuery){
        YesGraphAPI.install();
    });

    function waitForYesGraphTarget() {
        // Check the dom periodically until we find an
        // element with the id `yesgraph` to get settings from
        var d = jQuery.Deferred(),
            target,
            targetData,
            userData = {},
            timer = setInterval(function() {
                target = jQuery("#yesgraph");
                if (target.length > 0) {
                    var options = target.data();
                    d.resolve(options);
                }
            }, 100);
        d.always(function(){ clearInterval(timer); });
        return d.promise();
    }

    function loadRaven() {
        // Load a local version of Raven, accessible as YesGraphAPI.Raven
        // Use Raven.noConflict() to make sure that we don't overwrite
        // any existing instance of Raven.
        var d = jQuery.Deferred(),
            oldRaven = window.Raven ? window.Raven.noConflict() : undefined,
            newRaven,
            src = "https://cdn.ravenjs.com/3.0.4/raven.min.js",
            options = {
                includePaths: [
                    /https?:\/\/cdn\.yesgraph\.com*/
                ],
                shouldSendCallback: function(data) {
                    // Don't send the error to Sentry if the property noLog was set to true
                    return !(data.hasOwnProperty("noLog") && (!data.noLog));
                }
            };
        jQuery.getScript(src, function(){
            newRaven = window.Raven.noConflict();
            if (!RUNNING_LOCALLY) { newRaven.config(PUBLIC_RAVEN_DSN, options).install(); }
            if (oldRaven) { window.Raven = oldRaven; }
            d.resolve(newRaven);
        });
        return d.promise();
    }

    function requireScript(globalVar, script, func) {
        // Get the specified script if it hasn't been loaded already
        if (window.hasOwnProperty(globalVar)) {
            func(window[globalVar]);
        } else {
            return (function(d, t) {
                var g = d.createElement(t),
                    s = d.getElementsByTagName(t)[0];
                g.src = script;
                s.parentNode.insertBefore(g, s);
                g.onload = function() {
                    func(window[globalVar]);
                };
            }(document, 'script'));
        }
    }

    function YesGraphAPIConstructor() {
        this.SDK_VERSION = VERSION;
        this.isReady = false;
        this.hasLoadedSuperwidget = false;
        this.settings = settings;

        var self = this;

        this.hitAPI = function (endpoint, method, data, done, deferred) {
            var d = deferred || jQuery.Deferred();
            if (typeof method !== "string") {
                d.reject({error: "Expected method as string, not " + typeof method});
                return d.promise();
            } else if (method.toUpperCase() !== "GET") {
                data = JSON.stringify(data || {});
            }
            var ajaxSettings = {
                url: YESGRAPH_API_URL + endpoint,
                data: data,
                contentType: "application/json; charset=UTF-8",
                headers: {
                    "Authorization": "ClientToken " + YesGraphAPI.clientToken
                },
                success: function(data) {
                    data = typeof data === "string" ? JSON.parse(data) : data;
                    d.resolve(data);
                },
                error: function(data) {
                    d.reject(data.responseJSON || {error: data.statusText});
                }
            };

            // In jQuery 1.9+, the jQuery.ajax "type" is changed to "method"
            if (jQuery.fn.jquery < "1.9") {
                ajaxSettings.type = method;
            } else {
                ajaxSettings.method = method;
            }

            jQuery.ajax(ajaxSettings).always(function(resp) {
                var level;
                if (200 <= resp.status < 300) {
                    level = "info";
                } else if (resp.status > 500) {
                    level = "error";
                } else {
                    level = "warning";
                }
                if (self.Raven) {
                    self.Raven.captureBreadcrumb({
                        timestamp: new Date(),
                        level: level,
                        data: {
                            url: ajaxSettings.url,
                            method: ajaxSettings.method || ajaxSettings.type,
                            status_code: resp.status,
                            reason: resp.statusText,
                            requestData: ajaxSettings.data
                        }
                    });
                }
            });

            if (done) { d.done(done); }
            return d.promise();
        };

        this.rankContacts = function (rawContacts, done) {
            var matchDomain = settings.promoteMatchingDomain,
                domainVal = isNaN(Number(matchDomain)) ? matchDomain : Number(matchDomain);
            rawContacts.promote_matching_domain = domainVal;
            return self.hitAPI(ADDRBOOK_ENDPOINT, "POST", rawContacts, done);
        };

        this.getRankedContacts = function (done) {
            var matchDomain = settings.promoteMatchingDomain,
                domainVal = isNaN(Number(matchDomain)) ? matchDomain : Number(matchDomain);
            return self.hitAPI(ADDRBOOK_ENDPOINT, "GET", {promote_matching_domain: domainVal}, done);
        };

        this.postSuggestedSeen = function (seenContacts, done) {
            return self.hitAPI(SUGGESTED_SEEN_ENDPOINT, "POST", seenContacts, done);
        };

        this.postInvitesAccepted = function (invitesAccepted, done) {
            return self.hitAPI(INVITES_ACCEPTED_ENDPOINT, "POST", invitesAccepted, done);
        };

        this.postInvitesSent = function (invitesSent, done) {
            return self.hitAPI(INVITES_SENT_ENDPOINT, "POST", invitesSent, done);
        };

        this.test = function (done) {
            return self.hitAPI('/test', "GET", null, done);
        };

        this.noConflict = function() {
            delete window.YesGraphAPI;
            return self;
        };

        this.install = function(options) {
            var ravenDeferred = jQuery.Deferred(),
                clientTokenDeferred = jQuery.Deferred();

            self.AnalyticsManager = new AnalyticsManager(self);

            loadRaven().done(function(_Raven){
                self.Raven = _Raven;
                ravenDeferred.resolve();
            });

            waitForOptions().done(function(userData){
                self.utils.getOrFetchClientToken(userData).done(function(){
                    clientTokenDeferred.resolve();
                    self.AnalyticsManager.log(EVENTS.LOAD_JS_SDK);
                });
            });

            // If the client token fails, log that to Sentry
            clientTokenDeferred.fail(function(clientTokenResponse){
                ravenDeferred.done(function(){
                    self.Raven.captureBreadcrumb({
                        timestamp: new Date(),
                        message: "Client Token Request Failed",
                        level: "error",
                        data: clientTokenResponse
                    });
                    self.Raven.captureException(new Error("Client Token Request Failed"));
                });
            });

            jQuery.when(ravenDeferred, clientTokenDeferred).done(function(){
                self.Raven.setTagsContext({
                    sdk_version: self.SDK_VERSION,
                    app: self.app,
                    client_token: self.clientToken,
                    jquery_version: jQuery.fn.jquery
                });
                self.Raven.captureBreadcrumb({
                    timestamp: new Date(),
                    message: "YesGraphAPI Is Ready"
                });
                self.isReady = true;
            });

            function waitForOptions() {
                var d1 = jQuery.Deferred();
                var d2 = jQuery.Deferred();

                if (typeof options === "object" && options) {
                    d1.resolve(options);
                } else {
                    waitForYesGraphTarget().done(d1.resolve);
                }

                d1.done(function(options){
                    // Update the settings for the YesGraphAPI object
                    var userData = {};
                    var loadedDefaultParams = false;
                    var val;
                    self.app = self.app || options.app;
                    for (var opt in options) {
                        val = options[opt];
                        if (typeof val === "string" && val.startsWith("CURRENT_USER")) {
                            loadedDefaultParams = true;
                        }
                        if (self.settings.hasOwnProperty(opt)) {
                            self.settings[opt] = val;
                        } else {
                            userData[opt] = val;
                        }
                    }
                    if (loadedDefaultParams) {
                        self.AnalyticsManager.log(EVENTS.LOAD_DEFAULT_PARAMS);
                    }
                    d2.resolve(userData);
                });
                return d2.promise();
            }
        };

        this.utils = {
            readCookie: function(key) {
                var cookieName = key + "=";
                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = cookies[i];
                    while (cookie.charAt(0) == ' ') cookie = cookie.substring(1);
                    if (cookie.indexOf(cookieName) === 0) {
                        var value = cookie.substring(cookieName.length, cookie.length);
                        if (value !== "undefined") return value;
                        return undefined;
                    }
                }
            },
            setCookie: function (key, val, expDays) {
                var cookie = key + '=' + val;
                if (expDays) {
                    var expDate = new Date();
                    expDate.setTime(expDate.getTime() + (expDays * 24 * 60 * 60 * 1000));
                    cookie = cookie + '; expires=' + expDate.toGMTString();
                }
                window.document.cookie = cookie;
            },
            storeClientToken: function (data) {
                self.inviteLink = data.inviteLink;
                self.clientToken = data.token;
                self.utils.setCookie('yg-client-token', data.token);
            },
            getOrFetchClientToken: function (userData) {
                var data = {
                    appName: YesGraphAPI.app
                };
                data.userData = userData || undefined;
                self.clientToken = self.utils.readCookie('yg-client-token');
                data.token = self.clientToken;
                // If there is a client token available in the user's cookies,
                // hitting the API will validate the token and return the same one.
                // Otherwise, the API will create a new client token.
                return self.hitAPI(CLIENT_TOKEN_ENDPOINT, "POST", data, self.utils.storeClientToken).fail(function(data) {
                    var errorMsg = ((!data.error) || (data.error === "error")) ? "Client Token Request Failed." : data.error;
                    self.utils.error(data.error + " Please see docs.yesgraph.com/javascript-sdk or contact support@yesgraph.com", true);
                });
            },
            error: function (msg, fail, noLog) {
                var e = new Error(msg);
                e.name = "YesGraphError";
                if (self.Raven) {
                    self.Raven.captureBreadcrumb({
                        timestamp: new Date(),
                        message: msg,
                        level: fail ? "error" : "warning",
                        data: {
                            is_fatal: fail,
                            should_log: !noLog
                        }
                    });
                }
                self.AnalyticsManager.log(EVENTS.SAW_ERROR_MSG);
                if (fail) {
                    e.noLog = Boolean(noLog); // Optionally don't log to Sentry
                    throw e;
                } else {
                    console.log("YesGraphError", e);
                }
            }
        };
    }

    function AnalyticsManager(YesGraphAPI) {
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
                    "version": VERSION
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
                self.YesGraphAPI.Raven.captureBreadcrumb({
                    timestamp: timestamp || new Date(),
                    message: type,
                    data: {
                        target: target
                    }
                });
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
                    self.YesGraphAPI.hitAPI("/analytics/sdk", "POST", { entries: evts });
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
}());
