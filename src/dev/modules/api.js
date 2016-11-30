import AnalyticsManager from "./analytics.js";
import { SDK_VERSION, EVENTS, YESGRAPH_API_URL, RUNNING_LOCALLY, PUBLIC_RAVEN_DSN } from "./consts.js";
import { waitForYesGraphTarget } from "./utils.js";

var settings = {
    app: null,
    testmode: false,
    target: ".yesgraph-invites",
    contactImporting: true,
    showContacts: true,
    promoteMatchingDomain: false,
    emailSending: true,
    inviteLink: true,
    shareBtns: true,
    nolog: false
};

export default function YesGraphAPIConstructor() {
    this.SDK_VERSION = SDK_VERSION;
    this.isReady = false;
    this.hasLoadedSuperwidget = false;
    this.settings = settings;
    this.events = {
        INSTALLED_SDK: "installed.yesgraph.sdk"
    };

    var self = this;
    this.hitAPI = function (endpoint, method, data, done, maxTries, interval) {
        var d = jQuery.Deferred();
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
                "Authorization": "ClientToken " + self.clientToken
            }
        };

        // In jQuery 1.9+, the jQuery.ajax "type" is changed to "method"
        if (jQuery.fn.jquery < "1.9") {
            ajaxSettings.type = method;
        } else {
            ajaxSettings.method = method;
        }

        // Make an ajax call, retrying up to the specified number of times,
        // waiting the specified interval (in milliseconds) between tries
        new self.utils.AjaxRetry(ajaxSettings, maxTries, interval)
            .done(function(data) {
                try {
                    data = typeof data === "string" ? JSON.parse(data) : data;
                } catch (ignore) {}
                d.resolve(data);
            })
            .fail(function(error) {
                d.reject(error.responseJSON || {error: error.statusText});
            })
            .always(function(resp) {
                var level;
                if (200 <= resp.status < 300) {
                    level = "info";
                } else if (resp.status >= 500) {
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

    this.rankContacts = function (rawContacts, done, maxTries, interval) {
        var matchDomain = settings.promoteMatchingDomain,
            domainVal = isNaN(Number(matchDomain)) ? matchDomain : Number(matchDomain);
        rawContacts.promote_matching_domain = domainVal;
        return self.hitAPI("/address-book", "POST", rawContacts, done, maxTries, interval);
    };

    this.getRankedContacts = function (done, maxTries, interval) {
        var matchDomain = settings.promoteMatchingDomain,
            domainVal = isNaN(Number(matchDomain)) ? matchDomain : Number(matchDomain);
        return self.hitAPI("/address-book", "GET", {promote_matching_domain: domainVal}, done, maxTries, interval);
    };

    this.postSuggestedSeen = function (seenContacts, done, maxTries, interval) {
        return self.hitAPI("/suggested-seen", "POST", seenContacts, done, maxTries, interval);
    };

    this.postInvitesAccepted = function (invitesAccepted, done, maxTries, interval) {
        return self.hitAPI("/invites-accepted", "POST", invitesAccepted, done, maxTries, interval);
    };

    this.postInvitesSent = function (invitesSent, done, maxTries, interval) {
        return self.hitAPI("/invites-sent", "POST", invitesSent, done, maxTries, interval);
    };

    this.test = function (done, maxTries, interval) {
        return self.hitAPI('/test', "GET", null, done, maxTries, interval);
    };

    this.noConflict = function() {
        delete window.YesGraphAPI;
        return self;
    };

    this.install = function(options) {
        var ravenDeferred = jQuery.Deferred(),
            clientTokenDeferred = jQuery.Deferred();

        self.AnalyticsManager = new AnalyticsManager(self);
        self.AnalyticsManager.log(EVENTS.LOAD_JS_SDK);

        waitForOptions(options).done(function(userData){
            // Configure Sentry/Raven for error logging
            if (self.settings.nolog) {
                ravenDeferred.resolve();
            } else {
                self.utils.loadRaven()
                    .fail(function(){
                        self.AnalyticsManager.log(EVENTS.RAVEN_FAILED);
                    }).always(function() {
                        ravenDeferred.resolve(); // Fail gracefully no matter what
                    });
            }
            self.utils.getOrFetchClientToken(userData).done(clientTokenDeferred.resolve);
        });

        // If the client token fails, log that to Sentry
        if (self.Raven) {
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
        }

        jQuery.when(ravenDeferred, clientTokenDeferred).done(function(){
            if (self.Raven) {
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
            }
            self.isReady = true;
            $(document).trigger(self.events.INSTALLED_SDK);
        });

        function waitForOptions(options) {
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
                    if (typeof val === "string" && val.slice(0,12) == "CURRENT_USER") {
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
        loadRaven: function(){
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
                    whitelistUrls: [
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
                self.Raven = newRaven;
                d.resolve(newRaven);
            }).fail(function(){
                d.reject();
            });
            return d.promise();
        },
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
                appName: self.app
            };
            data.userData = userData || undefined;
            self.clientToken = self.utils.readCookie('yg-client-token');
            data.token = self.clientToken;
            // If there is a client token available in the user's cookies,
            // hitting the API will validate the token and return the same one.
            // Otherwise, the API will create a new client token.

            // Retry failed request up to 3 times, waiting 1500ms between tries
            return self.hitAPI("/client-token", "POST", data, self.utils.storeClientToken, 3, 1500).fail(function(error) {
                var errorMsg = ((!error.error) || (error.error === "error")) ? "Client Token Request Failed" : error.error;
                self.utils.error(errorMsg + ". Please see docs.yesgraph.com/javascript-sdk or contact support@yesgraph.com", true, true);
            });
        },
        error: function (msg, fail, noLog, level) {
            var e = new Error(msg);
            e.name = "YesGraphError";
            if (!level) {
                level = fail ? "error" : "warning";
            }
            if (self.Raven) {
                self.Raven.captureBreadcrumb({
                    timestamp: new Date(),
                    message: msg,
                    level: level,
                });
            }
            if (["error", "warning"].indexOf(level) !== -1) {
                self.AnalyticsManager.log(EVENTS.SAW_ERROR_MSG, msg);
            }
            if (fail) {
                e.noLog = Boolean(noLog); // Optionally don't log to Sentry
                throw e;
            } else {
                if (window.console) {
                    if (level === "warning" && console.warn) {
                        console.warn("YesGraph", e);
                    } else if ((["warning", "error"].indexOf(level) !== -1) && console.error) {
                        console.error("YesGraph", e);
                    } else if (console.info) {
                        console.info("YesGraph", e);
                    } else if (console.log) {
                        console.log("YesGraph", e);
                    }
                }
            }
        },
        AjaxRetry: function (settings, maxTries, interval) {
            var api = self;
            var completedTries = 0;
            maxTries = typeof maxTries === "number" ? maxTries : 1;
            interval = (typeof interval === "number" && maxTries > 1) ? interval : 0;

            function tryAjax (deferred) {
                var d = deferred || $.Deferred();
                $.ajax(settings)
                    .done(function(data) {
                        // If it succeeds, don't keep retrying
                        completedTries++;
                        d.resolve(data);
                    })
                    .fail(function(error) {
                        completedTries++;
                        // Log a breadcrumb to Sentry
                        if (api.Raven) {
                            api.Raven.captureBreadcrumb({
                                timestamp: new Date(),
                                message: "Retrying request to " + settings.url,
                                level: "warning"
                            });
                        }
                        // Recursively call this function again (after a timeout)
                        // until either it succeeds or we hit the max number of tries
                        if (completedTries < maxTries) {
                            setTimeout(function() {
                                if (window.console) {
                                    api.utils.error("Retrying request to " + settings.url);
                                }
                                tryAjax(d);
                            }, interval);
                        } else {
                            d.reject(error);
                        }
                    }).always(function(){
                        // console.log(completedTries)
                    });
                return d;
            }
            // Return a promise, so that we can chain methods
            // as we would with regular jQuery ajax calls
            return tryAjax().promise();
        }
    };

    this.mount = function(superwidget) {
        self.Superwidget = superwidget;
        self.Superwidget.YesGraphAPI = self;
        return self;
    };
}
