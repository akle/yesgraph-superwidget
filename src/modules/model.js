import { SUPERWIDGET_VERSION, CSS_VERSION } from "./consts.js";

export default function Model() {
    // Basic infraestructure
    var self = this;
    var TESTMODE = false;

    this.listeners = [];
    this.addListener = function(listener) {
        self.listeners.push(listener);
    };

    // Define methods for updating the model
    this.isTestMode = function(bool) {
        if (typeof bool === "boolean") {
            TESTMODE = bool;
        }
        return TESTMODE;
    };

    this.waitForAPIConfig = function() {
        var api = self.Superwidget.YesGraphAPI;
        var timer = setInterval(function () {
            if (api.isReady) {
                clearInterval(timer);
                api.isTestMode = self.isTestMode;
                if (api.Raven) {
                    api.Raven.setTagsContext({
                        superwidget_version: SUPERWIDGET_VERSION,
                        css_version: CSS_VERSION
                    });
                }
                // Add custom superwidget events
                api.events = $.extend(api.events, {
                    SET_RECIPIENTS: "set.yesgraph.recipients",
                    IMPORTED_CONTACTS: "imported.yesgraph.contacts",
                    CONTACT_IMPORT_FAILED: "import_failed.yesgraph.contacts",
                    INSTALLED_SUPERWIDGET: "installed.yesgraph.superwidget",
                    COMPLETED_OAUTH: "completed.yesgraph.oauth"
                });
                self.notifyApiConfigReady(api);
            }
        }, 100);
    };

    this.getWidgetOptions = function() {
        // If the Superwidget already has options set, use those.
        var existingOptions = self.Superwidget.options;
        if (existingOptions) {
            self.notifyGetWidgetOptionsSucceeded(existingOptions);
            return;
        }

        // If no options have been set yet, get them from the API
        var api = self.Superwidget.YesGraphAPI;
        var OPTIONS_ENDPOINT = '/apps/' + api.app + '/js/get-options';
        // Retry failed request up to 3 times, waiting 1500ms between tries
        api.hitAPI(OPTIONS_ENDPOINT, "GET", {}, null, 3, 1500)
            .done(self.notifyGetWidgetOptionsSucceeded)
            .fail(self.notifyGetWidgetOptionsFailed);
    };

    this.sendEmailInvites = function(recipients) {
        var api = self.Superwidget.YesGraphAPI;
        api.hitAPI("/send-email-invites", "POST", {
            recipients: recipients,
            test: TESTMODE || undefined,
            invite_link: api.inviteLink

        }).done(function (resp) {
            if (!resp.emails) {
                self.notifyEmailSendingFailed(resp);
            } else {
                // Hit the /invites-sent endpoint
                var invited = [];
                resp.sent.forEach(function(invitee) {
                    invited.push({
                        invitee_name: invitee[0] || undefined,
                        email: invitee[1],
                        sent_at: new Date().toISOString()
                    });
                });
                api.postInvitesSent({ entries: invited });
                self.notifyInvitesSent(resp);
            }
        }).fail(function (resp) {
            self.notifyEmailSendingFailed(resp);
        });
    };

    this.sawSuggestions = function(suggestedContacts) {
        self.Superwidget.YesGraphAPI.postSuggestedSeen({ entries: suggestedContacts });
    };

    // Define methods for notifying the controller
    this.notifyApiConfigReady = function(api) {
        self.listeners.forEach(function(listener) {
            listener.apiConfigReady(api);
        });
    };

    this.notifyGetWidgetOptionsSucceeded = function(options) {
        self.listeners.forEach(function(listener) {
            listener.widgetOptionsReady(options);
        });
    };

    this.notifyFetchContactsFailed = function(resp) {
        self.listeners.forEach(function(listener) {
            listener.fetchContactsFailed(resp);
        });
    };

    this.notifyFetchContactsSucceeded = function(resp) {
        self.listeners.forEach(function(listener) {
            listener.fetchContactsSucceeded(resp);
        });
    };

    this.notifyEmailSendingFailed = function(errorData) {
        self.listeners.forEach(function(listener){
            listener.emailSendingFailed(errorData);
        });
    };

    this.notifyInvitesSent = function(resp) {
        self.listeners.forEach(function(listener){
            listener.invitesSent(resp);
        });
    };

    this.fetchContacts = function(serviceId, authData) {
        self.Superwidget.YesGraphAPI.hitAPI("/oauth", "GET", {
            "service": serviceId,
            "token_data": JSON.stringify(authData)
        }).done(function(resp){
            if (resp.error) {
                self.notifyFetchContactsFailed(resp);
            } else {
                self.notifyFetchContactsSucceeded(resp);
            }
        }).fail(function(resp){
            self.notifyFetchContactsFailed(resp);
        });
    };
}

export function generateModelListener(listener) {
    // Establishes sane defaults for each required listener method,
    // so that we can easily add event listeners without breaking things
    var requiredFuncs = [
        "apiConfigReady",
        "widgetOptionsReady",
        "fetchContactsSucceeded",
        "fetchContactsFailed",
        "emailSendingFailed",
        "invitesSent"
    ];
    listener = listener || {};
    requiredFuncs.forEach(function(func){
        listener[func] = listener[func] || function(){};
    });
    return listener;
}
