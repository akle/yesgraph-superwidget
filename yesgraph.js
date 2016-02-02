(function($){

    var YESGRAPH_BASE_URL = 'https://api.yesgraph.com',
        YESGRAPH_API_URL = YESGRAPH_BASE_URL + '/v0',
        CLIENT_TOKEN_ENDPOINT = '/client-token',
        ADDRBOOK_ENDPOINT = '/address-book',
        SUGGESTED_SEEN_ENDPOINT = '/suggested-seen',
        INVITES_SENT_ENDPOINT = '/invites-sent',
        INVITES_ACCEPTED_ENDPOINT = '/invites-accepted',
        CLIENT_TOKEN,
        APP_NAME;

    function storeToken (data) {
        CLIENT_TOKEN = data.token;
        setCookie('yg-client-token', data.token);
    }

    function getClientToken () {
        CLIENT_TOKEN = readCookie('yg-client-token');
        if (!CLIENT_TOKEN) {
            return hitAPI(CLIENT_TOKEN_ENDPOINT, "GET", {appName: APP_NAME}, storeToken);
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
        getClientToken()
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
                // TODO: hit analytics API with responseTime
                d.resolve(resp.responseJSON);
            },
        });
        return d.promise().done(done);
    }

    function setCookie(key, val, expDays) {
        // Adapted from http://www.w3schools.com/js/js_cookies.asp
        var cookie = key + '=' + val;
        if (expDays) {
            var expDate = new Date();
            expDate.setTime(expDate.getTime() + (expDays*24*60*60*1000));
            cookie = cookie + '; expires=' + expDate.toGMTString();
        }
        document.cookie = cookie;
    }

    function readCookie(key) {
        // Adapted from http://www.w3schools.com/js/js_cookies.asp
        var key = key + "=";
        var cookies = document.cookie.split(';');
        for(var i=0; i < cookies.length; i++) {
            var cookie = cookies[i];
            while (cookie.charAt(0)==' ') cookie = cookie.substring(1);
            if (cookie.indexOf(key) == 0) return cookie.substring(key.length,cookie.length);
        }
    }

    function eraseCookie(key) {
        setCookie(key, '', -1);  // Expiry date is yesterday; Erase immediately
    }

}(jQuery));
