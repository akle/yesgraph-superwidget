(function() {
    "use strict";

    var VERSION = "dev/v0.0.3";
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
        YESGRAPH_BASE_URL = window.location.origin;
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

    function rankContacts(rawContacts, done) {
        var matchDomain = settings.promoteMatchingDomain,
            domainVal = isNaN(Number(matchDomain)) ? matchDomain : Number(matchDomain);
        rawContacts.promote_matching_domain = domainVal;
        return hitAPI(ADDRBOOK_ENDPOINT, "POST", rawContacts, done);
    }

    function getRankedContacts(done) {
        var matchDomain = settings.promoteMatchingDomain,
            domainVal = isNaN(Number(matchDomain)) ? matchDomain : Number(matchDomain);
        rawContacts.promote_matching_domain = domainVal;
        return hitAPI(ADDRBOOK_ENDPOINT, "GET", null, done);
    }

    function postSuggestedSeen(seenContacts, done) {
        return hitAPI(SUGGESTED_SEEN_ENDPOINT, "POST", seenContacts, done);
    }

    function postInvitesSent(invitesSent, done) {
        return hitAPI(INVITES_SENT_ENDPOINT, "POST", invitesSent, done);
    }

    function postInvitesAccepted(invitesAccepted, done) {
        return hitAPI(INVITES_ACCEPTED_ENDPOINT, "POST", invitesAccepted, done);
    }

    function test(done) {
        return hitAPI('/test', "GET", null, done);
    }

    function hitAPI(endpoint, method, data, done, deferred) {
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

        jQuery.ajax(ajaxSettings);
        if (done) { d.done(done); }
        return d.promise();
    }

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
                    window.location.href,
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

    function logScreenEvent() {
        var eventData = {
            "entries": [{
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
                    "app_name": YesGraphAPI.app
                },
                "timestamp": new Date(),
                "type": "screen"
            }, ]
        };
        return hitAPI(ANALYTICS_ENDPOINT, "POST", eventData);
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

        this.hitAPI = hitAPI;
        this.rankContacts = rankContacts;
        this.getRankedContacts = getRankedContacts;
        this.postSuggestedSeen = postSuggestedSeen;
        this.postInvitesSent = postInvitesSent;
        this.postInvitesAccepted = postInvitesAccepted;
        this.test = test;

        var self = this;

        this.noConflict = function() {
            delete window.YesGraphAPI;
            return self;
        };

        this.install = function(options) {
            var ravenDeferred = jQuery.Deferred(),
                clientTokenDeferred = jQuery.Deferred();

            loadRaven().done(function(_Raven){
                self.Raven = _Raven;
                ravenDeferred.resolve();
            });

            waitForOptions().done(function(userData){
                self.utils.getOrFetchClientToken(userData).done(function(){
                    clientTokenDeferred.resolve();
                    logScreenEvent();
                });
            });

            jQuery.when(ravenDeferred, clientTokenDeferred).done(function(){
                self.Raven.setTagsContext({
                    sdk_version: self.SDK_VERSION,
                    app: self.app,
                    client_token: self.clientToken
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
                    self.app = self.app || options.app;
                    for (var opt in options) {
                        if (self.settings.hasOwnProperty(opt)) {
                            self.settings[opt] = options[opt];
                        } else {
                            userData[opt] = options[opt];
                        }
                    }
                    d2.resolve();
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
                return hitAPI(CLIENT_TOKEN_ENDPOINT, "POST", data, self.utils.storeClientToken).fail(function(data) {
                    self.utils.error(data.error + " Please see docs.yesgraph.com/javascript-sdk or contact support@yesgraph.com", true);
                });
            },
            error: function (msg, fail, noLog) {
                var e = new Error(msg);
                e.name = "YesGraphError";
                if (fail) {
                    e.noLog = Boolean(noLog);// Optionally don't log to Sentry
                    throw e;
                } else {
                    console.log("YesGraphError", e);
                }
            }
        };
    }

}());