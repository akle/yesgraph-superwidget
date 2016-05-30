;
(function() {
    "use strict";

    var VERSION = "dev/v0.0.3",
        YESGRAPH_BASE_URL,
        YESGRAPH_API_URL,
        CLIENT_TOKEN_ENDPOINT = '/client-token',
        ADDRBOOK_ENDPOINT = '/address-book',
        SUGGESTED_SEEN_ENDPOINT = '/suggested-seen',
        INVITES_SENT_ENDPOINT = '/invites-sent',
        INVITES_ACCEPTED_ENDPOINT = '/invites-accepted',
        ANALYTICS_ENDPOINT = '/analytics/sdk',
        INVITE_LINK,
        settings = {
            app: null,
            testmode: false,
            target: ".yesgraph-invites",
            contactImporting: true,
            promoteMatchingDomain: false,
            emailSending: true,
            inviteLink: true,
            shareBtns: true
        },
        YesGraphAPI = new YesGraphAPIConstructor();

    // Don't load the widget twice
    if (!window.YesGraphAPI) {
        window.YesGraphAPI = YesGraphAPI;
    } else {
        error("YesGraph API has been loaded multiple times", true, true);
    }

    // Initialize in dev-mode as appropriate
    if (["localhost", "lvh.me"].indexOf(window.location.hostname) !== -1 && window.document.title === 'YesGraph') {
        YESGRAPH_BASE_URL = window.location.origin;
    } else {
        YESGRAPH_BASE_URL = "https://api.yesgraph.com";
    }
    YESGRAPH_API_URL = YESGRAPH_BASE_URL + '/v0';

    function YesGraphAPIConstructor() {
        this.SDK_VERSION = VERSION;
        this.isReady = false;
        this.hasLoadedSuperwidget = false;
        this.settings = settings;
        this.getApp = function() {
            return this.app
        }
        this.hasClientToken = function() {
            return Boolean(this.clientToken)
        }
        this.getClientToken = function() {
            return this.clientToken
        }
        this.getInviteLink = function() {
            return this.inviteLink
        }
        this.getSettings = function() {
            return this.settings
        }
    }

    // Get jQuery if it hasn't been loaded separately
    withScript("jQuery", "https://code.jquery.com/jquery-2.1.1.min.js", function($) {
        var ravenDeferred = $.Deferred(),
            clientTokenDeferred = $.Deferred();

        // Wait for each part of the setup to be complete, before adding
        // the methods dependent on that setup, and setting isReady = true
        $.when(ravenDeferred, clientTokenDeferred).done(function(){
            YesGraphAPI.hitAPI = hitAPI;
            YesGraphAPI.rankContacts = rankContacts;
            YesGraphAPI.getRankedContacts = getRankedContacts;
            YesGraphAPI.postSuggestedSeen = postSuggestedSeen;
            YesGraphAPI.postInvitesSent = postInvitesSent;
            YesGraphAPI.postInvitesAccepted = postInvitesAccepted;
            YesGraphAPI.test = test;
            YesGraphAPI.error = error;
            YesGraphAPI.isReady = true;
        });

        loadRaven().done(function(_Raven){
            YesGraphAPI.Raven = _Raven;
            ravenDeferred.resolve();
        });

        // Don't try to get a client token until we have found
        // a target element to get the necessary data from
        waitForYesGraphTarget().done(function(userData){
            getOrFetchClientToken(userData).done(function(){
                logScreenEvent();
                YesGraphAPI.Raven.setTagsContext({
                    sdk_version: YesGraphAPI.SDK_VERSION,
                    app: YesGraphAPI.app,
                    client_token: YesGraphAPI.clientToken
                });
            });
        });

        function storeClientToken(data) {
            INVITE_LINK = data.inviteLink;
            YesGraphAPI.clientToken = data.token;
            setCookie('yg-client-token', data.token);
            clientTokenDeferred.resolve();
        }

        function getOrFetchClientToken(userData) {
            var data = {
                appName: YesGraphAPI.app
            };
            data.userData = userData || undefined;
            YesGraphAPI.clientToken = readCookie('yg-client-token');
            data.token = YesGraphAPI.clientToken || undefined;
            return hitAPI(CLIENT_TOKEN_ENDPOINT, "POST", data, storeClientToken).fail(function(data) {
                error(data.error + " Please see docs.yesgraph.com/javascript-sdk", true);
            });
        }

        function rankContacts(rawContacts, done) {
            var matchDomain = settings.promoteMatchingDomain,
                domainVal = isNaN(Number(matchDomain)) ? matchDomain : Number(matchDomain);
            rawContacts["promote_matching_domain"] = domainVal;
            return hitAPI(ADDRBOOK_ENDPOINT, "POST", rawContacts, done);
        }

        function getRankedContacts(done) {
            var matchDomain = settings.promoteMatchingDomain,
                domainVal = isNaN(Number(matchDomain)) ? matchDomain : Number(matchDomain);
            rawContacts["promote_matching_domain"] = domainVal;
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

        function error(msg, fail, noLog) {
            var e = new Error(msg)
            e.name = "YesGraphError";
            e.noLog = Boolean(noLog);
            if (fail) {
                throw e;
            } else {
                console.log("YesGraphError", e);
            };
        }

        function configureAPI() {
            var api = {
                rankContacts: rankContacts,
                getRankedContacts: getRankedContacts,
                postSuggestedSeen: postSuggestedSeen,
                postInvitesSent: postInvitesSent,
                postInvitesAccepted: postInvitesAccepted,
                hitAPI: hitAPI,
                test: test,
                getApp: function(){
                    return YesGraphAPI.app;
                },
                getInviteLink: function() {
                    return INVITE_LINK;
                },
                hasClientToken: function() {
                    return clientTokenDeferred.state() === "resolved";
                },
                getClientToken: function() {
                    return CLIENT_TOKEN;
                },
                getSettings: function(){
                    return settings;
                },
                init: function(options) {
                    // Allows the user to override the default settings
                    for (prop in options) {
                        if (settings.hasOwnProperty(prop)) {
                            settings[prop] = options[prop];
                        }
                    }
                    initDeferred.resolve();
                },
                hasLoadedSuperwidget: false, // Updated by Superwidget
                error: error,
                events: {
                    RANKED_CONTACTS: "ranked.yesgraph.contacts",
                }
            };
            return api;
        }

        function hitAPI(endpoint, method, data, done, deferred) {
            var d = deferred || $.Deferred();
            if (!typeof method == "string") {
                d.reject({error: "Expected method as string, not " + typeof method})
                return d.promise();
            } else if (method.toUpperCase() !== "GET") {
                data = JSON.stringify(data || {});
            };
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
                    d.reject(data.responseJSON);
                }
            };
            // In jQuery 1.9+, the $.ajax "type" is changed to "method"
            $.fn.jquery < "1.9" ? ajaxSettings.type = method : ajaxSettings.method = method;

            $.ajax(ajaxSettings);
            if (done) { d.done(done); };
            return d.promise();
        }

        function waitForYesGraphTarget() {
            var d = $.Deferred(),
                target,
                targetData,
                userData = {},
                timer = setInterval(function() {
                    target = $("#yesgraph");
                    if (target.length > 0) {
                        targetData = target.data();
                        YesGraphAPI.app = targetData.app;
                        for (var opt in targetData) {
                            if (settings.hasOwnProperty(opt)) {
                                YesGraphAPI.settings[opt] = targetData[opt];
                            } else {
                                userData[opt] = targetData[opt];
                            }
                        }
                        d.resolve(userData);
                    }
                }, 100);
            d.always(function(){ clearInterval(timer); });
            return d.promise();
        }

        function loadRaven() {
            var d = $.Deferred(),
                oldRaven = window.Raven ? window.Raven.noConflict() : undefined,
                newRaven,
                src = "https://cdn.ravenjs.com/3.0.4/raven.js",
                publicDsn = "https://5068a9567f46439a8d3f4d3863a1ffce@app.getsentry.com/79999",
                options = {
                    includePaths: [
                        window.location.href,
                        /https?:\/\/cdn\.yesgraph\.com*/
                    ],
                    shouldSendCallback: function(data) {
                        return !(data.hasOwnProperty("noLog") && (!data.noLog))
                    }
                };
            $.getScript(src, function(){
                newRaven = window.Raven.noConflict().config(publicDsn, options).install();
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
    }); // withScript jQuery

    function withScript(globalVar, script, func) {
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
        };
    }
    function setCookie(key, val, expDays) {
        var cookie = key + '=' + val;
        if (expDays) {
            var expDate = new Date();
            expDate.setTime(expDate.getTime() + (expDays * 24 * 60 * 60 * 1000));
            cookie = cookie + '; expires=' + expDate.toGMTString();
        };
        window.document.cookie = cookie;
    }

    function readCookie(key) {
        var key = key + "=";
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i];
            while (cookie.charAt(0) == ' ') cookie = cookie.substring(1);
            if (cookie.indexOf(key) == 0) {
                var value = cookie.substring(key.length, cookie.length);
                if (value != "undefined") return value;
            };
        };
    }

    function eraseCookie(key) {
        setCookie(key, '#', -1);
    }
}());