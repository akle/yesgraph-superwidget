import { generateModelListener } from "./model.js";
import { generateViewListener } from "./view.js";
import { EVENTS, LIBRARY } from "./consts.js";

export default function Controller(model, view) {
    // The Controller receives event notifications from the View & the Model,
    // and then triggers the right behavior for each case

    var self = this;
    var utils = {
        matchTargetUrl: function(loc, targetUrl) {
            // The location should be considered a match if
            // (1) it includes the exact target url, or
            // (2) it matches the origin of the current page, and a hash is present
            if (!loc || !loc.href) return false;
            if (loc.href.indexOf(targetUrl) !== -1) return true;
            if (loc.origin == window.location.origin && loc.hash) return true;
            return false;
        },
        getUrlParam: function (url, name) {
            name = name.replace(new RegExp("/[[]/"), "\[").replace(new RegExp("/[]]/"), "\]");
            var regexS = "[\?&#]" + name + "=([^&#]*)";
            var regex = new RegExp(regexS);
            var results = regex.exec(url);
            return results == null ? null : results[1];
        },
        getSelectedRecipients: function (elem) {
            var recipient,
                recipients = [];

            if (elem.is("textarea")) {
                var text = elem.val();
                var regex = /([^<>\s,.;]*@[^<>\s,.;]*\.[^<>\s,.;]*)/gi;
                var match, lastMatchEnd = 0;
                while(true) {
                    match = regex.exec(text);
                    if (!match) break;
                    var name = text.slice(lastMatchEnd, match.index)
                                   .replace(/<|>|,|;/g, "")  // strip punctuation
                                   .replace(/^\s+|\s+$/g, "");  // strip whitespace
                    recipients.push({
                        name: name || undefined,
                        email: match[0] || undefined
                    });
                    lastMatchEnd = regex.lastIndex;
                }
                return recipients;

            } else {
                // Take the data- attributes of checkboxes
                var checked = elem.find('input[type="checkbox"]').filter(function () {
                    return Boolean($(this).prop("checked"));
                });

                // Return a list of "recipient" objects
                recipients = [];
                checked.map(function () {
                    var $this = $(this);
                    recipient = {
                        "name": $this.data("name") || undefined,
                        "email": $this.data("email") || undefined
                    };
                    recipients.push(recipient);
                });
                return recipients;
            }
        },
        validateSettings: function () {
            var settings = self.Superwidget.options.settings,
                settingsAreValid = Boolean(settings.hasValidEmailSettings[0]),
                msg = settings.hasValidEmailSettings[1];
            return [settingsAreValid, msg];
        }
    };

    var modelListener = generateModelListener({

        apiConfigReady: function(api) {
            var options = options || {};
            self.YesGraphAPI = api;
            api.utils = $.extend(true, {}, utils, api.utils); // overwrite bad utils
            model.getWidgetOptions();
        },

        widgetOptionsReady: function(options) {
            view.build(options);
            self.Superwidget.container = view.container;
            self.Superwidget.modal = view.modal;
            self.Superwidget.options = options;
            view.superwidgetReady();
        },

        fetchContactsSucceeded: function(resp) {
            var noSuggestions = Boolean(resp.meta.exception_matching_email_domain);
            view.fetchContactsSucceeded(resp.data.source, resp.data.ranked_contacts, resp.meta);
            view.modal.loadContacts(resp.data.ranked_contacts, noSuggestions);
            view.modal.openModal();
        },

        fetchContactsFailed: function(resp) {
            view.fetchContactsFailed(resp);
            view.modal.stopLoading();
            view.modal.closeModal();
        },

        emailSendingFailed: function(errorData) {
            view.emailSendingFailed(errorData);
        },

        invitesSent: function(resp) {
            var msg;
            if (self.YesGraphAPI.isTestMode()) {
                msg = "Testmode: emails not sent.";
                self.YesGraphAPI.utils.error(msg, undefined, undefined, "info");
            } else {
                msg = "You've added " + resp.sent.length;
                msg += resp.sent.length === 1 ? " friend!" : " friends!";                    
            }
            view.flashMessage.success(msg);
            self.YesGraphAPI.AnalyticsManager.log(EVENTS.INVITES_SENT, ".yes-modal-submit-btn", null, LIBRARY);
        }
    });

    var viewListener = generateViewListener({
        clipboardConfigFailed: function() {
            self.YesGraphAPI.AnalyticsManager.log(EVENTS.CLIPBOARD_FAILED, null, null, LIBRARY);
        },

        contactImportBtnClicked: function(serviceId) {
            view.startAuthFlow(serviceId);
            self.YesGraphAPI.AnalyticsManager.log(EVENTS.CLICK_CONTACT_IMPORT_BTN, ".yes-contact-import-btn-" + serviceId, null, LIBRARY);
        },
        authFailed: function(serviceId, err) {
            view.flashMessage.error(err.error);
            self.YesGraphAPI.utils.error(err.error);
        },
        authSucceeded: function(serviceId, authData) {
            view.modal.loading();
            model.fetchContacts(serviceId, authData);
        },
        inviteLinkCopied: function(){
            self.YesGraphAPI.AnalyticsManager.log(EVENTS.CLICK_COPY_LINK, null, null, LIBRARY);
        },
        sendBtnClicked: function(btnSelector, recipients) {
            // Validate recipients
            if (!recipients || recipients.length < 1) {
                view.emailSendingFailed({
                    error: "No valid recipients specified."
                });
                return;
            }

            // Validate settings
            var validationResult = self.YesGraphAPI.utils.validateSettings();
            var hasValidSettings = validationResult[0];
            if (!hasValidSettings) {
                var errorMsg = validationResult[1];
                view.emailSendingFailed({
                    error: errorMsg
                });
                return;
            }

            // Send the email invites
            $(document).trigger(self.YesGraphAPI.events.SET_RECIPIENTS, [recipients]);
            if (self.YesGraphAPI.settings.emailSending) {
                model.sendEmailInvites(recipients);
            }
        },
        sawSuggestions: function(suggestedContacts) {
            model.sawSuggestions(suggestedContacts);
            self.YesGraphAPI.AnalyticsManager.log(EVENTS.SUGGESTED_SEEN, null, null, LIBRARY);
        },
        socialShareBtnClicked: function(serviceId) {
            view.openSocialShareWindow(serviceId);
            self.YesGraphAPI.AnalyticsManager.log(EVENTS.CLICK_SOCIAL_MEDIA_BTN, ".yes-share-btn-" + serviceId, null, LIBRARY);
        }
    });

    model.addListener(modelListener);
    view.addListener(viewListener);
}
