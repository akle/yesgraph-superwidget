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

    function getClientToken () {
        function storeToken(data) {CLIENT_TOKEN = data.token;}
        if (!CLIENT_TOKEN) {
            hitAPI(CLIENT_TOKEN_ENDPOINT, "GET", {appName: APP_NAME}, storeToken);
        };
    }

    function rankContacts (rawContacts, done) {
        hitAPI(ADDRBOOK_ENDPOINT, "POST", rawContacts, done);
    }

    function getRankedContacts (done) {
        hitAPI(ADDRBOOK_ENDPOINT, "GET", null, done);
    }

    function postSuggestedSeen (seenContacts, done) {
        hitAPI(SUGGESTED_SEEN_ENDPOINT, "POST", seenContacts, done);
    }

    function postInvitesSent (invitesSent, done) {
        hitAPI(INVITES_SENT_ENDPOINT, "POST", invitesSent, done);
    }

    function postInvitesAccepted (invitesAccepted, done) {
        hitAPI(INVITES_ACCEPTED_ENDPOINT, "POST", invitesAccepted, done);
    }

    function test (done) {
        hitAPI('/test', "GET", null, done);
    }

    function initializer (settings) {
        APP_NAME = settings.app;
        getClientToken();
        return {
            rankContacts: rankContacts,
            getRankedContacts: getRankedContacts,
            postSuggestedSeen: postSuggestedSeen,
            postInvitesSent: postInvitesSent,
            postInvitesAccepted: postInvitesAccepted,
            hitAPI: hitAPI,
            test: test
        };
    }

    window.YesGraph = initializer;

    function hitAPI (endpoint, method, data, done) {
        var d = $.Deferred();

        if (method.toUpperCase() !== "GET") {
            data = JSON.stringify(data || {});
        }

        $.ajax({
            url: YESGRAPH_API_URL + endpoint,
            data: data,
            method: method,
            contentType: "application/json; charset=UTF-8",
            headers: {"Authorization": "ClientToken " + CLIENT_TOKEN},
            success: function (data) {
                d.resolve(data);
            },
        });
        d.promise().done(done);
    }

}(jQuery));
