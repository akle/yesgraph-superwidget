(function($){

    var VERSION = "v0.0.1",
        YESGRAPH_BASE_URL = 'https://api.yesgraph.com',
        YESGRAPH_API_URL = YESGRAPH_BASE_URL + '/v0',
        CLIENT_TOKEN_ENDPOINT = '/client-token',
        ADDRBOOK_ENDPOINT = '/address-book',
        SUGGESTED_SEEN_ENDPOINT = '/suggested-seen',
        INVITES_SENT_ENDPOINT = '/invites-sent',
        INVITES_ACCEPTED_ENDPOINT = '/invites-accepted',
        ANALYTICS_ENDPOINT = '/analytics/sdk',
        CLIENT_TOKEN,
        APP_NAME;

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

    function logScreenEvent () {
        var eventData = {
            "entries": [
                {
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
                },
            ]
        };
        return hitAPI(ANALYTICS_ENDPOINT, "POST", eventData);
    }

    function storeToken (data) {
        CLIENT_TOKEN = data.token;
        cookie.set('yg-client-token', data.token);
    }

    function getClientToken (userData) {
        CLIENT_TOKEN = cookie.read('yg-client-token');
        if (!CLIENT_TOKEN) {
            var data = {appName: APP_NAME};
            data.userData = userData ? userData : undefined;
            return hitAPI(CLIENT_TOKEN_ENDPOINT, "POST", data, storeToken);
        } else {
            return $.Deferred().resolve().promise();
        };
    }

    function rankContacts (rawContacts, done) {
        return hitAPI(ADDRBOOK_ENDPOINT, "POST", rawContacts, done);            
    }

    function getRankedContacts (done) {
        return hitAPI(ADDRBOOK_ENDPOINT, "GET", null, done);
    }

    function postSuggestedSeen (seenContacts, done) {
        return hitAPI(SUGGESTED_SEEN_ENDPOINT, "POST", seenContacts, done);
    }

    function postInvitesSent (invitesSent, done) {
        return hitAPI(INVITES_SENT_ENDPOINT, "POST", invitesSent, done);
    }

    function postInvitesAccepted (invitesAccepted, done) {
        return hitAPI(INVITES_ACCEPTED_ENDPOINT, "POST", invitesAccepted, done);
    }

    function test (done) {
        return hitAPI('/test', "GET", null, done);
    }

    function configureAPI () {
        APP_NAME = $('#yesgraph').data("app");
        userData = $('#yesgraph').data();
        getClientToken(userData).then(logScreenEvent);

        var api = {
            rankContacts: rankContacts,
            getRankedContacts: getRankedContacts,
            postSuggestedSeen: postSuggestedSeen,
            postInvitesSent: postInvitesSent,
            postInvitesAccepted: postInvitesAccepted,
            hitAPI: hitAPI,
            test: test,
            app: APP_NAME,
            hasClientToken: function () {return Boolean(CLIENT_TOKEN)}
        };
        return api;
    }

    window.YesGraphAPI = configureAPI();

    function hitAPI (endpoint, method, data, done, deferred) {
        var d = deferred || $.Deferred();
        if (method.toUpperCase() !== "GET") {
            data = JSON.stringify(data || {});
        }

        var startTime = new Date().valueOf();
        $.ajax({
            url: YESGRAPH_API_URL + endpoint,
            data: data,
            method: method,
            contentType: "application/json; charset=UTF-8",
            headers: {"Authorization": "ClientToken " + CLIENT_TOKEN},
            complete: function (resp) {
                var responseTime = new Date().valueOf() - startTime;
                d.resolve(resp.responseJSON);
            },
        });
        if (done) {
            d.done(done);
        }
        return d.promise();
    }
}(jQuery));
