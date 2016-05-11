;
(function() {

    var VERSION = "v0.0.2",
        YESGRAPH_BASE_URL,
        YESGRAPH_API_URL,
        CLIENT_TOKEN_ENDPOINT = '/client-token',
        ADDRBOOK_ENDPOINT = '/address-book',
        SUGGESTED_SEEN_ENDPOINT = '/suggested-seen',
        INVITES_SENT_ENDPOINT = '/invites-sent',
        INVITES_ACCEPTED_ENDPOINT = '/invites-accepted',
        ANALYTICS_ENDPOINT = '/analytics/sdk',
        JQUERY_VERSION,
        CLIENT_TOKEN,
        INVITE_LINK,
        APP_NAME,
        settings = {
            app: null,
            testmode: false,
            target: ".yesgraph-invites",
            contactImporting: true,
            emailSending: true,
            inviteLink: true,
            shareBtns: true
        };

    if (["localhost", "lvh.me"].indexOf(window.location.hostname) !== -1 && window.document.title === 'YesGraph') {
        YESGRAPH_BASE_URL = window.location.origin;
    } else {
        YESGRAPH_BASE_URL = "https://api.yesgraph.com";
    }
    YESGRAPH_API_URL = YESGRAPH_BASE_URL + '/v0';

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

    // Get jQuery if it hasn't been loaded separately
    withScript("jQuery", "https://code.jquery.com/jquery-2.1.1.min.js", function($) {
        var initDeferred = $.Deferred();
        JQUERY_VERSION = $.fn.jquery;

        var cookie = (function() {

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

            return {
                set: setCookie,
                read: readCookie,
                erase: eraseCookie
            };
        }());

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
                        "app_name": APP_NAME
                    },
                    "timestamp": new Date(),
                    "type": "screen"
                }, ]
            };
            return hitAPI(ANALYTICS_ENDPOINT, "POST", eventData);
        }

        function storeToken(data) {
            CLIENT_TOKEN = data.token;
            INVITE_LINK = data.inviteLink;
            cookie.set('yg-client-token', data.token);
        }

        function getClientToken(userData) {
            var data = {
                appName: APP_NAME
            };
            data.userData = userData || undefined;
            CLIENT_TOKEN = cookie.read('yg-client-token');
            data.token = CLIENT_TOKEN || undefined;
            return hitAPI(CLIENT_TOKEN_ENDPOINT, "POST", data, storeToken).fail(function(data) {
                error(data.error + " Please see docs.yesgraph.com/javascript-sdk", true);
            });
        }

        function rankContacts(rawContacts, done) {
            return hitAPI(ADDRBOOK_ENDPOINT, "POST", rawContacts, done);
        }

        function getRankedContacts(done) {
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

        function error(msg, fail) {
            var e = new Error(msg)
            e.name = "YesGraphError";
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
                    return APP_NAME;
                },
                getInviteLink: function() {
                    return INVITE_LINK;
                },
                hasClientToken: function() {
                    return Boolean(CLIENT_TOKEN);
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

            // Don't try to get a client token until we have found
            // a target element to get the necessary data from
            waitForYesGraphTarget().done(function(target){
                APP_NAME = target.data("app");
                var targetData = target.data(),
                    userData = {};
                for (prop in targetData) {
                    if (settings.hasOwnProperty(prop)) {
                        settings[prop] = targetData[prop];
                    } else {
                        userData[prop] = targetData[prop];
                    }
                }
                getClientToken(userData).then(logScreenEvent);
            });
            return api;
        }

        // Don't initialize multiple times
        if (!window.YesGraphAPI) {
            window.YesGraphAPI = configureAPI();
        } else {
            error("YesGraph API has been loaded multiple times", true);
        };

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
                    "Authorization": "ClientToken " + CLIENT_TOKEN
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
            JQUERY_VERSION < "1.9" ? ajaxSettings.type = method : ajaxSettings.method = method;

            $.ajax(ajaxSettings);
            if (done) { d.done(done); };
            return d.promise();
        }

        function waitForYesGraphTarget() {
            var target,
                timer = setInterval(function() {
                    target = $("#yesgraph");
                    if (target.length > 0) {
                        initDeferred.resolve(target);
                    }
                }, 100);
            initDeferred.always(function(){ clearInterval(timer); });
            return initDeferred.promise();
        }

    });
}());