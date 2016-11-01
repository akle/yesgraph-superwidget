/*!
 * YesGraph Superwidget dev/__SUPERWIDGET_VERSION__
 *
 * https://www.yesgraph.com
 * https://docs.yesgraph.com/docs/superwidget
 * 
 * Date: __BUILD_DATE__
 */

(function($){
    "use strict";

    var VERSION = "dev/__SUPERWIDGET_VERSION__";
    var SDK_VERSION = "dev/__SDK_VERSION__"; // jshint ignore:line
    var CSS_VERSION = "dev/__CSS_VERSION__";
    var LIBRARY = {
        name: "yesgraph-invites.js",
        version: VERSION
    };
    var EVENTS = {
        LOAD_SUPERWIDGET: "Loaded Superwidget",
        CLICK_CONTACT_IMPORT_BTN: "Clicked Contact Import Button",
        CLICK_SOCIAL_MEDIA_BTN: "Clicked Social Media Button",
        CLICK_COPY_LINK: "Clicked to Copy Invite Link",
        SUGGESTED_SEEN: "Viewed Suggested Contacts",
        INVITES_SENT: "Invite(s) Sent"
    };

    // Check the protocol used by the window
    var PROTOCOL;
    if (window.location.protocol.indexOf("http") !== -1) {
        PROTOCOL = window.location.protocol;
    } else {
        PROTOCOL = "http:";
    }

    function requireScript(globalVar, script, func) {
        // Get the specified script if it hasn't been loaded already
        if (window.hasOwnProperty(globalVar)) {
            func(window[globalVar]);
        } else {
            return (function (d, t) {
                var g = d.createElement(t);
                var s = d.getElementsByTagName(t)[0];
                g.src = script;
                s.parentNode.insertBefore(g, s);
                if (typeof func === "function") {
                    g.onload = function () {
                        func(window[globalVar]);
                    };
                }
            }(document, 'script'));
        }
    }

    function MessageManager(messageSection) {
        var self = this;

        this.message = function(msg, type, duration) {
            var flashDiv = $("<div>", {
                "class": "yes-flash yes-flash-" + type,
                "text": msg || ""
            });
            messageSection.append(flashDiv.hide());
            flashDiv.show(300);

            window.setTimeout(function () {
                flashDiv.hide(300, function () {
                    $(this).remove();
                });
            }, duration || 3500);
        };

        this.success = function(msg, duration) {
            msg = msg || "Success!";
            self.message(msg, "success", duration);
        };

        this.error = function(msg, duration) {
            msg = "Error: " + (msg || "Something went wrong.");
            self.message(msg, "error", duration);
        };
    }

    function WidgetContainerFactory(view, settings, options) {
        // This factory creates & returns the HTML for the Superwidget container as a jQuery collection

        var targetSelector = options.target || ".yesgraph-invites";
        var JQUERY_VERSION = $.fn.jquery;

        var container = $("<div>", {
            "class": "yes-widget-container"
        });
        var containerHeader = $("<div>", {
            "class": "yes-header-1"
        });
        var containerBody = $("<div>");
        var shareBtnSection = $("<div>", {
            "class": "yes-share-btn-section"
        });
        var flashSection = $("<div>", {
            "class": "yes-flash-message-section"
        });
        var linkback = $("<span>", {
            "id": "powered-by-yesgraph",
            "text": "Powered by ",
            "style": "display: block !important; visibility: visible !important; font-size: 12px !important; font-style: italic !important;"
        }).append($("<a>", {
            "href": "https://www.yesgraph.com/demo?utm_source=superwidget&utm_medium=superwidget&utm_campaign=superwidget",
            "text": "YesGraph",
            "target": "_blank",
            "style": "color: red !important; text-decoration: none !important;"
        }));
        var inviteLinkInput = $("<input>", {
            "readonly": true,
            "id": "yes-invite-link"
        }).css({
            "width": "100%",
            "border": "1px solid #ccc",
            "text-overflow": "ellipsis",
            "padding": "5px 7px"
        }).on("click", function () {
            this.select();
        });
        var inviteLinkSection = $("<div>", {
            "class": "yes-invite-link-section"
        }).css({
            "display": "table",
            "width": "100%",
            "font-size": "0.85em",
            "margin": "5px 0"
        }).append(inviteLinkInput);
        var sections = [containerHeader, containerBody];
        if (settings.inviteLink) { sections.push(inviteLinkSection); }
        if (settings.shareBtns) { sections.push(shareBtnSection); }
        sections.push(flashSection);

        if (JQUERY_VERSION >= "1.8") {
            container.append(sections); // Appending an array is only possible in 1.8+
        } else {
            sections.forEach(function(section){
                container.append(section);
            });
        }
        if (options.linkback) {
            container.append(linkback);
        }

        var widgetCopy = options.widgetCopy || {};
        if (widgetCopy.widgetHeadline) {
            var headline = $("<p>", {
                "class": "yes-header-1",
                "text": widgetCopy.widgetHeadline
            });
            containerHeader.append(headline);
        }

        // Add the social share buttons
        var shareBtns = generateShareButtons(options, view.Superwidget.YesGraphAPI);
        shareBtnSection.append(shareBtns);
        $(targetSelector).html(container);

        // Add the contact importing buttons
        var includeGoogle = options.settings.oauthServices.indexOf("google") !== -1,
            includeOutlook = options.settings.oauthServices.indexOf("outlook") !== -1,
            includeYahoo = options.settings.oauthServices.indexOf("yahoo") !== -1,
            includeSlack = options.settings.oauthServices.indexOf("slack") !== -1,
            contactImportingServices = {
                "google": {
                    id: "google",
                    name: "Gmail",
                    include: includeGoogle,
                    authManagerOptions: {
                        id: "google",
                        name: "Gmail",
                        baseAuthUrl: "https://accounts.google.com/o/oauth2/auth",
                        authParams: {
                            access_type: "offline",
                            client_id: null,
                            prompt: "consent", // Ensures that a refresh_token will be included
                            redirect_uri: null,
                            response_type: "code",
                            scope: [
                                "https://www.google.com/m8/feeds/",
                                "https://www.googleapis.com/auth/userinfo.email"
                            ].join(" "),
                            state: window.location.href
                        },
                        popupSize: "width=550, height=550"
                    }
                },
                "outlook": {
                    id: "outlook",
                    name: "Outlook",
                    include: includeOutlook,
                    authManagerOptions: {
                        id: "outlook",
                        name: "Outlook",
                        baseAuthUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
                        authParams: {
                            client_id: null,
                            redirect_uri: null,
                            response_type: "token",
                            scope: "https://outlook.office.com/contacts.read",
                            state: window.location.href
                        },
                        popupSize: "width=900, height=700"
                    }
                },
                "hotmail": {
                    id: "hotmail",
                    name: "Hotmail",
                    include: includeOutlook,
                    authManagerOptions: {
                        id: "outlook",
                        name: "Hotmail",
                        baseAuthUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
                        authParams: {
                            client_id: null,
                            redirect_uri: null,
                            response_type: "token",
                            scope: "https://outlook.office.com/contacts.read",
                            state: window.location.href
                        },
                        popupSize: "width=900, height=700"
                    }
                },
                "yahoo": {
                    id: "yahoo",
                    name: "Yahoo",
                    include: includeYahoo,
                    authManagerOptions: {
                        id: "yahoo",
                        name: "Yahoo",
                        baseAuthUrl: "https://api.login.yahoo.com/oauth2/request_auth",
                        authParams: {
                            client_id: null,
                            redirect_uri: null,
                            response_type: "token",
                            state: window.location.href
                        },
                        popupSize: "width=900, height=700"
                    }
                },
                "slack": {
                    id: "slack",
                    name: "Slack",
                    include: includeSlack,
                    authManagerOptions: {
                        id: "slack",
                        name: "Slack",
                        baseAuthUrl: "https://slack.com/oauth/authorize",
                        authParams: {
                            client_id: null,
                            redirect_uri: null,
                            scope: "users:read",
                            state: window.location.href
                        },
                        popupSize: "width=900, height=700"
                    }
                }
            },
            contactImportSection = $("<div>", {
                "class": "yes-contact-import-section"
            }),
            btnCount = 0 + Number(includeGoogle) + Number(includeYahoo) + (Number(includeOutlook) * 2),
            btnText = "";
        view.contactImportingServices = contactImportingServices;

        // Create a button for each contact importing service, & instantiate an auth manager
        var btn, service, serviceId;
        for (serviceId in contactImportingServices) {
            if (contactImportingServices.hasOwnProperty(serviceId)) {
                service = contactImportingServices[serviceId];
                btn = generateContactImportBtn(btnText, btnCount, service);
                contactImportSection.append(btn);
                service.authManager = new AuthManager(service.authManagerOptions, options, view.Superwidget.YesGraphAPI);
            }
        }

        if (settings.contactImporting) { containerBody.append(contactImportSection); }

        // Add the manual input form
        var manualInputForm = $('<form>', {
                "class": "yes-manual-input-form"
            }),
            manualInputField = $("<textarea>", {
                "rows": 3,
                "class": "yes-manual-input-field"
            }).prop("placeholder", widgetCopy.manual_input_placeholder || "Enter emails here"),
            manualInputSubmit = $('<button>', {
                "text": widgetCopy.manualInputSendBtn || "Add Emails",
                "class": "yes-default-btn yes-manual-input-submit",
                "type": "button"
            });
        manualInputForm.append(manualInputField, manualInputSubmit);

        if (settings.emailSending) { containerBody.append(manualInputForm); }

        return container;
    }

    function generateContactImportBtn(btnText, btnCount, service) {
        var icon = $("<div>", {
                "class": "yes-contact-import-btn-icon"
            }),
            text = $("<span>", {
                "text": btnText + service.name,
                "class": "yes-contact-import-btn-text"
            }),
            innerWrapper = $("<div>").css("display", "table").append(icon, text),
            outerWrapper = $("<div>").css({
                "display": "inline-block",
                "vertical-align": "middle"
            }).append(innerWrapper),
            btnClass = "yes-default-btn yes-contact-import-btn yes-contact-import-btn-" + service.id,
            btn = $("<button>", {
                "class": btnClass,
                "data-service": service.id,
                "title": service.name,
                "type": "button"
            }).append(outerWrapper);

        if (btnCount > 3) {
            btn.addClass("yes-no-label"); // Only show the icon if there are more than 3 buttons
        } else if (service.id === "slack") {
            btn.addClass("yes-alt-icon"); // Use the monochrome icon
        }
        return btn;
    }

    function generateShareButtons(options, api) {
        if (options.shareButtons.length === 0) { return false; }
        var buttonsDiv = $("<div>"),
            shareBtn,
            shareBtnIcon,
            shareBtnText,
            inviteLink = api.inviteLink,
            services = [{
                "ID": "facebook",
                "name": "Facebook",
                "baseURL": "https://www.facebook.com/share.php",
                "params": {
                    u: encodeURI(inviteLink),
                    title: options.widgetCopy.shareMessage
                },
                "colors": ["#3B5998", "#324b81"]
            }, {
                "ID": "twitter",
                "name": "Twitter",
                "baseURL": "https://twitter.com/intent/tweet",
                "params": {
                    text: options.widgetCopy.shareMessage + ' ' + inviteLink
                },
                "colors": ["#55ACEE", "#2E99EA"]
            }, {
                "ID": "linkedin",
                "name": "LinkedIn",
                "baseURL": "https://www.linkedin.com/shareArticle",
                "params": {
                    "mini": true,
                    "url": inviteLink,
                    "summary": options.widgetCopy.shareMessage
                },
                "colors": ["#0077B5", "#006399"]
            }, {
                "ID": "pinterest",
                "name": "Pinterest",
                "baseURL": "https://www.pinterest.com/pin/create/button",
                "params": {
                    "url": inviteLink
                },
                "colors": ["#BD081C", "#AB071A"]
            }];

        var elemType, btnProps;
        services.forEach(function(service){
            if (options.shareButtons.indexOf(service.ID) === -1) return; 

            shareBtnIcon = $("<span>", {
                "class": "yes-share-btn-icon"
            });
            shareBtnText = $("<span>", {
                "text": service.name,
                "class": "yes-share-btn-text"
            });
            btnProps = {
                "class": "yes-share-btn yes-share-btn-" + service.ID,
                "data-id": service.ID,
                "data-url": service.baseURL + "?" + $.param(service.params),
                "data-color": service.colors[0],
                "data-hover-color": service.colors[1]
            };
            if (service.ID !== "pinterest") {
                elemType = "<span>";
            } else {
                // Handle Pinterest differently, because the interface is an overlay
                // on the current window (not a separate popup, like the other services)
                elemType = "<a>";
                btnProps.href = service.baseURL + "?" + $.param(service.params);
                btnProps["data-pin-do"] = "buttonBookmark";
                btnProps["data-pin-custom"] = true;
                $("img").not("[data-pin-description]").each(function () {
                    this.dataset.pinDescription = options.widgetCopy.shareMessage + " " + inviteLink;
                });
                requireScript("pinUtils", PROTOCOL + "//assets.pinterest.com/js/pinit.js");
            }
            shareBtn = $(elemType, btnProps);
            shareBtn.append(shareBtnIcon, shareBtnText);
            buttonsDiv.append(shareBtn);
        });
        return buttonsDiv;
    }

    function View() {
        // Basic infraestructure
        var self = this;
        this.listeners = [];
        this.addListener = function(listener) {
            listener = listener || new ViewListener();
            self.listeners.push(listener);
            return listener;
        };

        // Define methods for updating the view
        this.loadCssIfNotFound = function() {
            var stylesheets = document.styleSheets;
            var link;
            var i;
            for (i = 0; i < stylesheets.length; i += 1) {
                link = stylesheets[i].href || "";
                if (link.match(/yesgraph-invites[\S]*.css\b/)) {
                    return;
                }
            }
            var yesgraphCSS = $("<link>", {
                "rel": "stylesheet",
                "type": "text/css",
                "charset": "utf-8",
                "href": PROTOCOL + "//cdn.yesgraph.com/" + CSS_VERSION + "/yesgraph-invites.min.css"
            });

            $("head").prepend(yesgraphCSS);
        };

        this.loadClipboard = function() {
            var d = $.Deferred();
            if (window.Clipboard && typeof Clipboard === "function") {
                d.resolve();
            } else {
                var clipboardCDN = "https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/1.5.8/clipboard.min.js";
                $.getScript(clipboardCDN).done(d.resolve).fail(d.reject);
            }
            return d.promise();
        };

        this.configureClipboard = function() {
            // Enable copying with the copy button
            var clipboardExists = false;
            var clipboard;
            try {
                clipboard = new Clipboard('#yes-invite-link-copy-btn');
                clipboardExists = true;
                self.clipboard = clipboard;
            } catch (e) {
                self.notifyClipboardConfigFailed();
            }

            // Add the copy button to the UI
            if (clipboardExists) {
                var copyInviteLinkBtn = $("<span>", {
                    "id": "yes-invite-link-copy-btn",
                    "data-clipboard-target": "#yes-invite-link",
                    "text": "Copy",
                    "type": "button"
                });
                self.container.find(".yes-invite-link-section").append(copyInviteLinkBtn);
            }
        };

        this.buildWidgetContainer = function(settings, options) {
            self.container = WidgetContainerFactory(self, settings, options);
            self.loadCssIfNotFound();
            self.loadClipboard().done(self.configureClipboard);
        };

        this.buildContactsModal = function(options) {
            self.modal = new Modal(options);
        };

        this.build = function(options) {
            var api = self.Superwidget.YesGraphAPI;
            self.options = options;
            self.buildWidgetContainer(api.settings, options);
            self.buildContactsModal(options);
            self.updateInviteLink(api.inviteLink);
            self.bindEvents(options);
            self.buildMessageManager();
        };

        this.superwidgetReady = function() {
            var api = self.Superwidget.YesGraphAPI;
            self.Superwidget.isReady = true;
            $(document).trigger(api.events.INSTALLED_SUPERWIDGET);
        };

        this.updateInviteLink = function(url) {
            self.container.find("#yes-invite-link").val(url);
        };

        this.buildMessageManager = function(options) {
            var messageSection = self.container.find(".yes-flash-message-section");
            self.flashMessage = new MessageManager(messageSection, options);
        };

        this.startAuthFlow = function(serviceId) {
            var authManager = self.contactImportingServices[serviceId].authManager;
            authManager.authPopup()
                .done(function(data){
                    self.notifyAuthSucceeded(serviceId, data);
                })
                .fail(function(err) {
                    self.notifyAuthFailed(serviceId, err);
                });
        };

        this.notifyAuthSucceeded = function(serviceId, data) {
            var api = self.Superwidget.YesGraphAPI;
            $(document).trigger(api.events.COMPLETED_OAUTH, [serviceId, null]);
            self.listeners.forEach(function(listener) {
                listener.authSucceeded(serviceId, data);
            });
        };

        this.notifyAuthFailed = function(serviceId, err) {
            var api = self.Superwidget.YesGraphAPI;
            $(document).trigger(api.events.COMPLETED_OAUTH, [serviceId, err]);
            self.listeners.forEach(function(listener) {
                listener.authFailed(serviceId, err);
            });
        };

        this.fetchContactsSucceeded = function(addrbookSource, rankedContacts, responseMeta) {
            var imported_contacts_evt = self.Superwidget.YesGraphAPI.events.IMPORTED_CONTACTS;
            $(document).trigger(imported_contacts_evt, [addrbookSource, rankedContacts, responseMeta]);
        };

        this.fetchContactsFailed = function(resp) {
            $(document).trigger(self.YesGraphAPI.events.CONTACT_IMPORT_FAILED, [resp]);
        };

        function Modal(options) {
            // Constructor for the contacts modal, which generates the HTML,
            // and exposes methods for opening, closing, & updating the modal

            // Make sure this gets called as a Constructor with the `new` keyword
            if (!(this instanceof Modal)) throw new Error("Constructor called as a function");

            // Create & assemble HTML for the modal
            var widgetCopy = options.widgetCopy || {},
                isOpen = false,
                modal = $("<div>", {
                    "class": "yes-modal"
                }),
                overlay = $("<div>", {
                    "class": "yes-modal-overlay"
                }),
                loader = $("<div>", {
                    "class": "yes-loading-icon"
                }),
                modalHeader = $("<div>", {
                    "class": "yes-modal-header"
                }),
                modalBody = $("<div>", {
                    "class": "yes-modal-body"
                }).append(loader),
                modalFooter = $("<div>", {
                    "class": "yes-modal-footer"
                }),
                modalCloseBtn = $("<div>", {
                    "html": "&times;",
                    "class": "yes-modal-close-btn"
                }),
                contactContainer = $("<div>", {
                    "class": "yes-contact-container"
                }),
                modalSendBtn = $("<input>", {
                    "type": "submit",
                    "value": "Add",
                    "class": "yes-default-btn yes-modal-submit-btn"
                }),
                titleText,
                modalTitle = $("<p>", {
                    "class": "yes-modal-title"
                }),
                searchField = $("<input>", {
                    "type": "text",
                    "placeholder": "Search",
                    "class": "yes-search-field"
                }),
                suggestedHeader = $("<p>", {
                    "text": "Suggested",
                    "class": "yes-contact-list-header"
                }),
                suggestedList = $("<div>", {
                    "class": "yes-suggested-contact-list"
                }),
                totalHeader = $("<p>", {
                    "text": "All Contacts",
                    "class": "yes-contact-list-header"
                }),
                totalList = $("<div>", {
                    "class": "yes-total-contact-list"
                }),
                selectAll = $("<input>", {
                    "class": "yes-select-all",
                    "type": "checkbox"
                }),
                selectAllForm = $("<form>", {
                    "class": "yes-select-all-form"
                }).append(selectAll, $("<label>", {
                    "text": "Select All"
                }));

            closeModal();
            titleText = widgetCopy.contactsModalHeader || "Add Friends";
            modalTitle.text(titleText);
            modalHeader.append(modalTitle, modalCloseBtn);
            modalBody.append(contactContainer);
            modalFooter.append(modalSendBtn);
            modal.append(modalHeader, modalBody, modalFooter);
            $("body").append(overlay, modal);
            applyModalStyling();

            // Expose publicly available methods
            this.isOpen = function(){ return isOpen; };
            this.openModal = openModal;
            this.closeModal = closeModal;
            this.centerModal = centerModal;
            this.loadContacts = loadContacts;
            this.loading = loading;
            this.stopLoading = stopLoading;
            this.container = modal;
            this.overlay = overlay;

            // Check that the viewport is set, so that the contacts
            // modal is properly centered on mobile devices
            if ($("meta[name='viewport']").length === 0) {
                $("head").prepend($("<meta>", {
                    name: "viewport",
                    content: "width=device-width, initial-scale=1.0"
                }));
            }

            function updateSendBtn() {
                // Updates the send button with a count of selected contacts
                var btnText = '',
                    btnTextOptions = widgetCopy.modalSendBtn || {},
                    checked = modalBody.find('input[type="checkbox"]')
                        .filter(":not(.yes-select-all-form *)")
                        .filter(function () {
                            return Boolean($(this).prop("checked"));
                        });

                if (checked.length === 0) {
                    btnText = btnTextOptions.noneSelected || "No contacts selected";
                } else if (checked.length === 1) {
                    btnText = btnTextOptions.oneSelected || "Send 1 Email";
                } else {
                    btnText = btnTextOptions.manySelected || "Send {{ count }} Emails";
                }
                btnText = btnText.replace(/\{\{[\s]*count[\s]*\}\}/i, checked.length);
                modalSendBtn.val(btnText);
            }

            function toggleSelected(evt) {
                var checkbox = $(evt.target).find("[type='checkbox']");
                checkbox.prop("checked", !checkbox.prop("checked"));
                updateSendBtn();
            }

            function addRow(target, contact, allEmails) {
                if ((!contact.emails) || contact.emails.length === 0) return;

                var contactRow,
                    contactDetails,
                    contactEmail,
                    checkbox,
                    emailCount = allEmails ? contact.emails.length : 1,
                    suggestedEmails = $.map(suggestedList.find(".yes-contact-row-checkbox input"), function (elem) {
                        return $(elem).data("email");
                    });

                for (var i = 0; i < emailCount; i += 1) {
                    // Check if they're also in the suggested list
                    if (suggestedEmails.indexOf(contact.emails[i]) === -1) {
                        contactEmail = $("<span>", {
                            html: contact.emails[i]
                        });
                        checkbox = $('<input>', {
                            type: "checkbox"
                        });

                        contactRow = $('<div>', {
                            class: "yes-contact-row"
                        });
                        contactDetails = $("<div>", {
                            class: "yes-contact-details"
                        });

                        contactRow.append($('<div>', {
                            class: "yes-contact-row-checkbox"
                        }).append(checkbox), contactDetails);

                        contactDetails.append($('<div>', {
                            class: "yes-contact-row-name"
                        }));
                        contactDetails.append($('<div>', {
                            class: "yes-contact-row-email"
                        }).append($("<div>").append(contactEmail)));

                        if (contact.name) {
                            contactRow.find(".yes-contact-row-name").append($('<span>', {
                                html: contact.name
                            }));
                        }

                        checkbox.data("email", contact.emails[i]);
                        checkbox.data("name", contact.name || undefined);
                        checkbox.data("");
                        contactRow.on("click", toggleSelected);

                        target.append(contactRow);
                    }
                }
            }

            function loadContacts(contacts, noSuggestions) {
                // Wrapping and styling allows divs with unspecified
                // heights to behave like scrollable tables
                var innerWrapper = $("<div>", {
                    style: "height: 100%; position: relative; overflow-x: hidden;"
                }).append(totalList);
                var wrappedTotalList = $("<div>", {
                    style: "height: 100%; display: table-cell; width: 100%;"
                }).append(innerWrapper);
                var wrappedSuggestedList = $("<div>", {
                    style: "max-height: 180px; overflow-x: hidden;"
                }).append(suggestedList);
                var noContactsWarning = $("<p>", {
                    "text": "None found!",
                    "class": "yes-none-found-warning"
                });
                var suggestedContactCount = 5;
                noSuggestions = (contacts.length < suggestedContactCount) || noSuggestions;

                if (contacts.length === 0) {
                    stopLoading();
                    modalTitle.text("No contacts found!");
                    modalSendBtn.css("visibility", "hidden");
                    return;
                }

                // Suggested Contacts
                if (!noSuggestions) {
                    var foundContacts = 0;
                    var i = 0;
                    var contact;

                    while (foundContacts < suggestedContactCount) {
                        contact = contacts[i];
                        if (!contact) break;
                        // Only suggest the contact if it has a name and an email
                        if (contact.name && contact.emails.length > 0) {
                            addRow(suggestedList, contact, false);
                            foundContacts++;
                        }
                        i++;
                    }
                    if (foundContacts === 0) {
                        noSuggestions = true;
                    }

                    // Parse the suggested list for the displayed contacts
                    var now = new Date().toISOString();
                    if (!noSuggestions) {
                        var seenContacts = suggestedList.find(".yes-contact-row").map(function(){
                            var row = $(this);
                            return {
                                name: row.find(".yes-contact-row-name span").text(),
                                emails: [row.find(".yes-contact-row-email span").text()],
                                seen_at: now
                            };
                        }).get();
                        self.Superwidget.YesGraphAPI.postSuggestedSeen({ entries: seenContacts });
                        self.Superwidget.YesGraphAPI.AnalyticsManager.log(EVENTS.SUGGESTED_SEEN, null, null, LIBRARY);
                    }
                }

                // Total Contacts (Alphabetical)

                function compareContacts(a, b) {
                    // Sort contact objects alphabetically, prioritizing in this order:
                    // 1. contacts with names starting with letters
                    // 2. contacts with names starting with non-letters
                    // 3. contacts with only emails, starting with letters
                    // 4. contacts with only emails, starting with non-letters
                    var nameA = a.name || "", emailsA = a.emails || "";
                    var nameB = b.name || "", emailsB = b.emails || "";
                    var matchNumbers = /\b([0-9]*)/;
                    var matchText = /\b[0-9]*(.*)/;
                    var matchA, matchB;

                    if (nameA && nameB) {
                        matchA = matchNumbers.exec(nameA);
                        matchA = Number(matchA ? matchA[0] : undefined);
                        matchNumbers.lastIndex = 0;

                        matchB = matchNumbers.exec(nameB);
                        matchB = Number(matchB ? matchB[0] : undefined);
                        matchNumbers.lastIndex = 0;

                        if (matchA && !matchB) { return 1; }
                        if (matchB && !matchA) { return -1; }
                        if (matchA && matchB) {
                            if (matchA < matchB) { return -1; }
                            if (matchA > matchB) { return 1; }
                            if (matchA === matchB) {
                                // Sort the letters
                                var textA = matchText.exec(nameA)[0];
                                matchText.lastIndex = 0;
                                var textB = matchText.exec(nameB)[0];
                                matchText.lastIndex = 0;
                                return textA <= textB ? -1 : 1;
                            }
                        }
                        return nameA <= nameB ? -1 : 1;
                    } else if (!nameA && !nameB) {
                        if (!emailsA || !emailsB) { return 0; }
                        return emailsA[0] <= emailsB[0] ? -1 : 1;
                    }
                    return Boolean(b.name) - Boolean(a.name);
                }

                var sortedContacts = contacts.sort(compareContacts);
                sortedContacts.forEach(function(contact) {
                    addRow(totalList, contact, true);
                });

                totalList.prepend(noContactsWarning.hide());
                if (noSuggestions) {
                    contactContainer.append(searchField, selectAllForm, totalHeader, wrappedTotalList);
                } else {
                    contactContainer.append(searchField,
                        selectAllForm,
                        suggestedHeader,
                        wrappedSuggestedList,
                        totalHeader,
                        wrappedTotalList);
                }
                stopLoading();

                // Autoselect suggested contacts
                if (!noSuggestions) {
                    suggestedList.find("input[type='checkbox']").prop("checked", true);
                }

                // Uppercase "YesContains" is a case-insensitive
                // version of jQuery "contains" used for doing
                // case-insensitive searches
                $.expr[':'].YesContains = function (a, i, m) {
                    return jQuery(a).text().toUpperCase()
                        .indexOf(m[3].toUpperCase()) >= 0;
                };

                // Make the "Total" list searchable
                searchField.on("input", function (evt) {
                    var matching_rows,
                        searchString = evt.target.value;

                    totalList.find('.yes-contact-row').hide();
                    matching_rows = totalList.find('.yes-contact-row:YesContains("' + searchString + '")');
                    matching_rows.show();
                    if (matching_rows.length === 0) {
                        noContactsWarning.show();
                    } else {
                        noContactsWarning.hide();
                    }
                });

                updateSendBtn();
                applyModalStyling();
            }

            function applyModalStyling() {

                selectAll.css({
                    "margin": "0 6px"
                });

                selectAllForm.css({
                    "font-weight": "200"
                });

                totalList.css({
                    "position": "absolute",
                    "top": "0",
                    "bottom": "0",
                    "left": "0",
                    "right": "0"
                });

                $(".yes-contact-list-header").css({
                    "display": "table-row",
                    "font-size": "16px",
                    "font-weight": "bolder",
                    "height": "30px",
                    "line-height": "30px",
                    "margin": "0"
                });
            }

            function openModal(evt) {
                try {
                    evt.preventDefault();
                } catch (ignore) {}
                modal.show();
                centerModal();
                overlay.show();
                isOpen = true;
            }

            function closeModal(evt) {
                try {
                    evt.preventDefault();
                } catch (ignore) {}
                modal.hide();
                overlay.hide();
                isOpen = false;
            }

            function centerModal(evt) {
                try {
                    evt.preventDefault();
                } catch (ignore) {}
                var top = 20,
                    left = Math.max($(window).width() - modal.outerWidth(), 0) / 2;
                // If the doctype is set to HTML, we can center the modal vertically
                // based on the viewport size (rather than use the default 20px set above).
                if (window.document.doctype && (window.document.doctype === "html")) {
                    top = Math.max($(window).height() - modal.outerHeight(), 0) / 2;
                }
                modal.css({
                    top: top + $(window).scrollTop(),
                    left: left + $(window).scrollLeft()
                });
            }

            function clean() {
                // Detach items that we might need to re-attach later
                // Remove items that we won't re-use
                var itemsToDetach = contactContainer.children(),
                    itemsToRemove = $(".yes-contact-row").add(".yes-none-found-warning");
                itemsToDetach.detach();
                itemsToRemove.remove();
            }

            function loading() {
                overlay.show();
                clean();
                modalSendBtn.css("visibility", "hidden");
                modalTitle.text("Loading contacts...");
                loader.css("display", "block");
                modal.show();
                centerModal();
                isOpen = true;
            }

            function stopLoading() {
                modalSendBtn.css("visibility", "visible");
                modalTitle.text(titleText);
                loader.css("display", "none");
            }
        }

        this.cleanModal = function() {
            // Detach items that we might need to re-attach later
            // Remove items that we won't re-use
            var itemsToDetach = self.modal.container.find(".yes-contact-container").children();
            var itemsToRemove = self.modal.container.find(".yes-contact-row").add(".yes-none-found-warning");
            itemsToDetach.detach();
            itemsToRemove.remove();
        };

        this.compareContacts = function(a, b) {
            // Sort contact objects alphabetically, prioritizing in this order:
            // 1. contacts with names starting with letters
            // 2. contacts with names starting with non-letters
            // 3. contacts with only emails, starting with letters
            // 4. contacts with only emails, starting with non-letters
            var nameA = a.name || "", emailsA = a.emails || "";
            var nameB = b.name || "", emailsB = b.emails || "";
            var matchNumbers = /\b([0-9]*)/;
            var matchText = /\b[0-9]*(.*)/;
            var matchA, matchB;

            if (nameA && nameB) {
                matchA = matchNumbers.exec(nameA);
                matchA = Number(matchA ? matchA[0] : undefined);
                matchNumbers.lastIndex = 0;

                matchB = matchNumbers.exec(nameB);
                matchB = Number(matchB ? matchB[0] : undefined);
                matchNumbers.lastIndex = 0;

                if (matchA && !matchB) { return 1; }
                if (matchB && !matchA) { return -1; }
                if (matchA && matchB) {
                    if (matchA < matchB) { return -1; }
                    if (matchA > matchB) { return 1; }
                    if (matchA === matchB) {
                        // Sort the letters
                        var textA = matchText.exec(nameA)[0];
                        matchText.lastIndex = 0;
                        var textB = matchText.exec(nameB)[0];
                        matchText.lastIndex = 0;
                        return textA <= textB ? -1 : 1;
                    }
                }
                return nameA <= nameB ? -1 : 1;
            } else if (!nameA && !nameB) {
                if (!emailsA || !emailsB) { return 0; }
                return emailsA[0] <= emailsB[0] ? -1 : 1;
            }
            return Boolean(b.name) - Boolean(a.name);
        };


        this.addRow = function(target, contact, allEmails) {

            if ((!contact.emails) || contact.emails.length === 0) {
                return;
            }

            var contactRow,
                contactDetails,
                contactEmail,
                checkbox,
                emailCount = allEmails ? contact.emails.length : 1,
                suggestedList = $(".yes-suggested-contact-list"),
                suggestedEmails = $.map(suggestedList.find(".yes-contact-row-checkbox input"), function (elem) {
                    return $(elem).data("email");
                });

            for (var i = 0; i < emailCount; i += 1) {
                // Check if they're also in the suggested list
                if (suggestedEmails.indexOf(contact.emails[i]) === -1) {
                    contactEmail = $("<span>", {
                        html: contact.emails[i]
                    });
                    checkbox = $('<input>', {
                        type: "checkbox"
                    });

                    contactRow = $('<div>', {
                        "class": "yes-contact-row"
                    });
                    contactDetails = $("<div>", {
                        "class": "yes-contact-details"
                    });

                    contactRow.append($('<div>', {
                        "class": "yes-contact-row-checkbox"
                    }).append(checkbox), contactDetails);

                    contactDetails.append($('<div>', {
                        "class": "yes-contact-row-name"
                    }));
                    contactDetails.append($('<div>', {
                        "class": "yes-contact-row-email"
                    }).append($("<div>").append(contactEmail)));

                    if (contact.name) {
                        contactRow.find(".yes-contact-row-name").append($('<span>', {
                            html: contact.name
                        }));
                    }

                    checkbox.data("email", contact.emails[i]);
                    checkbox.data("name", contact.name || undefined);
                    checkbox.data("");
                    target.append(contactRow);
                }
            }
        };

        this.toggleSelected = function(evt) {
            var checkbox = $(evt.target).find("[type='checkbox']");
            checkbox.prop("checked", !checkbox.prop("checked"));
            self.updateModalSendBtn();
        };

        this.applyStyling = function() {
            var selectAllForm = $(".yes-select-all-form");
            selectAllForm.css({
                "font-weight": "200"
            });
            selectAllForm.find("input[type='checkbox']").css({
                "margin": "0 6px"
            });
            $(".yes-total-contact-list").css({
                "position": "absolute",
                "top": "0",
                "bottom": "0",
                "left": "0",
                "right": "0"
            });
            $(".yes-contact-list-header").css({
                "display": "table-row",
                "font-size": "16px",
                "font-weight": "bolder",
                "height": "30px",
                "line-height": "30px",
                "margin": "0"
            });
        };

        this.updateModalSendBtn = function() {
            // Updates the send button with a count of selected contacts
            var options = self.options;
            var btnText = '';
            var btnTextOptions = options.widgetCopy.modalSendBtn || {};
            var checked = self.modal.container.find(".yes-modal-body")
                .find('input[type="checkbox"]')
                .filter(":not(.yes-select-all-form *)")
                .filter(function () {
                    return Boolean($(this).prop("checked"));
                });

            if (checked.length === 0) {
                btnText = btnTextOptions.noneSelected || "No contacts selected";
            } else if (checked.length === 1) {
                btnText = btnTextOptions.oneSelected || "Send 1 Email";
            } else {
                btnText = btnTextOptions.manySelected || "Send {{ count }} Emails";
            }
            btnText = btnText.replace(/\{\{[\s]*count[\s]*\}\}/i, checked.length);
            $(".yes-modal-submit-btn").val(btnText);
        };

        this.emailSendingFailed = function(data) {
            var errors = data.errors;
            var api = self.Superwidget.YesGraphAPI;
            if (errors) {
                // Show each message separately
                var msg, error, description;
                for (error in errors) {
                    if (errors.hasOwnProperty(error)) {
                        description = errors[error];
                        msg = error + ": " + description;
                        self.flashMessage.error(msg);
                        api.utils.error(msg);
                    }
                }
            } else {
                self.flashMessage.error(data.error);
                api.utils.error(data.error);
            }
        };

        this.openSocialShareWindow = function(serviceId) {
            if (serviceId === "pinterest") return; // Pinterest will open automatically
            var targ = self.container.find(".yes-share-btn-" + serviceId);
            open(targ.data("url"), "_blank", 'width=550, height=550');
        };

        // Define methods for notifying the controller
        this.notifyClipboardConfigFailed = function() {
            self.listeners.forEach(function(listener){
                listener.clipboardConfigFailed();
            });
        };

        this.notifyInviteLinkCopied = function() {
            self.listeners.forEach(function(listener) {
                listener.inviteLinkCopied();
            });
        };

        this.notifyContactImportBtnClicked = function(service) {
            self.listeners.forEach(function(listener) {
                listener.contactImportBtnClicked(service);
            });
        };

        this.notifySocialShareBtnClicked = function(serviceId) {
            self.listeners.forEach(function(listener) {
                listener.socialShareBtnClicked(serviceId);
            });
        };

        this.notifySendBtnClicked = function(btnSelector, recipients) {
            self.listeners.forEach(function(listener) {
                listener.sendBtnClicked(btnSelector, recipients);
            });
        };

        this.notifySawSuggestions = function(suggestedContacts) {
            self.listeners.forEach(function(listener){
                listener.sawSuggestions(suggestedContacts);
            });
        };

        // Bind DOM events to the right notifications
        this.bindEvents = function() {
            var options = self.options;
            var api = self.Superwidget.YesGraphAPI;

            // Contact importing buttons
            self.container
                .find(".yes-contact-import-btn")
                .on("click", function() {
                    var serviceId = $(this).data("service");
                    self.notifyContactImportBtnClicked(serviceId);
                });

            // Manual input submit button
            self.container
                .find(".yes-manual-input-submit")
                .on("click", function (evt) {
                    evt.preventDefault();
                    var manualInputField = self.container.find(".yes-manual-input-field");
                    var recipients = api.utils.getSelectedRecipients(manualInputField);
                    self.notifySendBtnClicked(".yes-manual-input-submit", recipients);
                    manualInputField.val("");
                });

            // Social media sharing buttons
            self.container
                .find(".yes-share-btn")
                .on("click", function(){
                    var serviceId = $(this).data("id");
                    self.notifySocialShareBtnClicked(serviceId);
                });

            // Invite link copy button
            self.container
                .find(".yes-invite-link-section")
                .on("click", self.notifyInviteLinkCopied);

            if (self.clipboard) {
                self.clipboard.on('success', function (e) {
                    var originalCopy = e.trigger.textContent;
                    e.trigger.textContent = "Copied!";
                    window.setTimeout(function () {
                        e.trigger.textContent = originalCopy;
                    }, 3000);
                });
                self.clipboard.on('error', function () {
                    var manualCopyCommand = (navigator.userAgent.indexOf('Mac OS') !== -1) ? "Cmd + C" : "Ctrl + C";
                    self.notifyClipboardCopyFailed(manualCopyCommand);
                });
            }

            $(window).on("resize", function(){
                if (self.modal) self.modal.centerModal();
            });

            // "Select All" checkbox
            $(document).on("click", ".yes-select-all-form [type='checkbox']", function(evt) {
                var checkboxes = self.modal.container.find(".yes-modal-body [type='checkbox']");
                checkboxes.prop("checked", $(evt.target).prop("checked"));
            });

            // Contact checkboxes
            $(document).on("click", ".yes-contact-row", function(evt) {
                self.toggleSelected(evt, options);
            });

            // Modal send button
            self.modal.container.find(".yes-modal-submit-btn").on("click", function(evt){
                evt.preventDefault();

                // Parse unique recipients
                var suggestedList = self.modal.container.find(".yes-suggested-contact-list");
                var totalList = self.modal.container.find(".yes-total-contact-list");
                var suggested = api.utils.getSelectedRecipients(suggestedList);
                var alphabetical = api.utils.getSelectedRecipients(totalList);
                var recipients = suggested.concat(alphabetical);
                var emails = [], uniqueRecipients = [];
                recipients.forEach(function (recip) {
                    if (emails.indexOf(recip.email) === -1) {
                        emails.push(recip.email);
                        uniqueRecipients.push(recip);
                    }
                });

                // Pass recipients to the controller
                self.notifySendBtnClicked(".yes-modal-submit-btn", uniqueRecipients);
                self.modal.closeModal();
            });

            // Modal close button
            self.modal.container.find(".yes-modal-close-btn").on("click", self.modal.closeModal);

            // Modal overlay
            self.modal.overlay.on("click", self.modal.closeModal);
        };
    }

    function AuthManager (service, options, api) {
        var self = this;
        this.service = service;
        this.options = options;

        this.authPopup = function () {
            var d = $.Deferred();
            var getUrlParam = api.utils.getUrlParam;
            var msg, authCode, accessToken, errorMsg, responseUrl;
            var defaultAuthErrorMessage = self.service.name + " Authorization Failed";
            var oauthInfo = self.getOAuthInfo(self.service);
            var popup = open(oauthInfo.url, "_blank", service.popupSize);
            var popupTimer = setInterval(function() {
                if (typeof popup !== "object" || popup.closed === true) {
                    d.reject({ error: defaultAuthErrorMessage });
                    clearInterval(popupTimer);
                    return;
                }
                try {
                    // If the flow has finished, resolve with the token or reject with the error
                    if (api.utils.matchTargetUrl(popup.location, oauthInfo.redirect)) {
                        responseUrl = popup.document.URL;
                        errorMsg = getUrlParam(responseUrl, "error_description") || getUrlParam(responseUrl, "error");
                        authCode = getUrlParam(responseUrl, "code");
                        accessToken = getUrlParam(responseUrl, "access_token") || getUrlParam(responseUrl, "token");
                        if (errorMsg) {
                            d.reject({ error: errorMsg });
                        } else if (authCode) {
                            d.resolve({
                                auth_code: authCode,
                                token_type: "code"
                            });
                        } else if (accessToken) {
                            d.resolve({
                                access_token: accessToken,
                                token_type: "access_token"
                            });
                        } else {
                            d.reject({ error: defaultAuthErrorMessage }); // This should never happen
                        }
                        clearInterval(popupTimer);
                        if (popup) {
                            popup.close();
                        }
                    }
                } catch (e) {
                    // Check the error message, then either keep waiting or reject with the error
                    var okErrorMessages = /(Cannot read property 'URL' of undefined|undefined is not an object \(evaluating '\w*.document.URL'\)|Permission denied to access property "\w*"|Permission denied)/, // jshint ignore:line
                        canIgnoreError = (e.code === 18 || okErrorMessages.test(e.message));
                    if (!canIgnoreError) {
                        msg = canIgnoreError ? defaultAuthErrorMessage : e.message;
                        d.reject({
                            error: msg
                        });
                        api.utils.error(msg, false);
                        clearInterval(popupTimer);
                        if (popup) {
                            popup.close();
                        }
                    }
                }
            }, 500);
            return d.promise();
        };

        this.getOAuthInfo = function (settings) {
            var redirect, localHostnames = ["localhost", "lvh.me"];
            if (localHostnames.indexOf(window.location.hostname) !== -1 || self.options.integrations[settings.id].usingDefaultCredentials) {
                redirect = window.location.origin;
            } else {
                redirect = self.options.integrations[settings.id].redirectUrl;
            }
            if (settings.authParams.client_id === null) {
                settings.authParams.client_id = self.options.integrations[settings.id].clientId;
            }
            if (settings.authParams.redirect_uri === null) {
                settings.authParams.redirect_uri = self.options.integrations[settings.id].redirectUrl;
            }
            var fullUrl = settings.baseAuthUrl + "?" + $.param(settings.authParams);
            return {
                url: fullUrl,
                redirect: redirect
            };
        };
    }

    function Model() {
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
                            superwidget_version: VERSION,
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
                    api.AnalyticsManager.log(EVENTS.INVITES_SENT, ".yes-modal-submit-btn", null, LIBRARY);
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

    function ViewListener(listener) {
        // Establishes sane defaults for each required listener method,
        // so that we can easily add event listeners without breaking things
        var requiredFuncs = [
            "clipboardConfigFailed",
            "inviteLinkCopied",
            "contactImportBtnClicked",
            "socialShareBtnClicked",
            "sendBtnClicked",
            "authComplete",
            "authFailed",
            "apiConfigReady",
            "sawSuggestions",
        ];
        requiredFuncs.forEach(function(func) {
            if (!listener[func]) {
                listener[func] = function(){};
            }
        });
        return listener;
    }

    function ModelListener(listener) {
        // Establishes sane defaults for each required listener method,
        // so that we can easily add event listeners without breaking things
        var requiredFuncs = [
            "apiConfigReady",
            "widgetOptionsReady",
            "fetchContactsSucceeded",
            "fetchContactsFailed",
            "sendEmailInvites",
            "emailSendingFailed",
            "invitesSent"
        ];
        requiredFuncs.forEach(function(func) {
            if (!listener[func]) {
                listener[func] = function(){};
            }
        });
        return listener;
    }

    function Controller(model, view) {
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

        var modelListener = ModelListener({

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
                    view.flashMessage.success(msg);
                    return;
                }
                msg = "You've added " + resp.sent.length;
                msg += resp.sent.length === 1 ? " friend!" : " friends!";
                view.flashMessage.success(msg);
            }

        });

        var viewListener = ViewListener({
            contactImportBtnClicked: function(serviceId) {
                view.startAuthFlow(serviceId);
            },
            authFailed: function(serviceId, err) {
                view.flashMessage.error(err.error);
                self.YesGraphAPI.utils.error(err.error);
            },
            authSucceeded: function(serviceId, authData) {
                view.modal.loading();
                model.fetchContacts(serviceId, authData);
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
            },
            socialShareBtnClicked: function(serviceId) {
                view.openSocialShareWindow(serviceId);
                model.Superwidget.YesGraphAPI.AnalyticsManager.log(EVENTS.CLICK_SOCIAL_MEDIA_BTN, ".yes-share-btn-" + serviceId, null, LIBRARY);
            }
        });

        model.addListener(modelListener);
        view.addListener(viewListener);
    }

    function Superwidget() {
        var self = this;

        this.isReady = false;

        this.init = function(options, model, view) {
            if (!self.YesGraphAPI) {
                // This state should never occur, but this is a sane default behavior
                throw new Error("YesGraph Error: Unmounted Superwidget. " +
                                "Use YesGraphAPI.mount(superwidget) before calling superwidget.init()");
            }
            self.options = options || undefined;
            self.model = model || self.model || new Model();
            self.view = view || new View();
            self.controller = self.controller || new Controller(self.model, self.view);

            self.model.Superwidget = self;
            self.view.Superwidget = self;
            self.controller.Superwidget = self;
            self.modal = self.view.modal; // shortcut for operating the view modal

            self.model.waitForAPIConfig();
        };
    }
    // Once the SDK script has been loaded, initialize the Superwidget
    var SDK_URL = PROTOCOL + "//cdn.yesgraph.com/" + SDK_VERSION + "/yesgraph.min.js";
    requireScript("YesGraphAPI", SDK_URL, function(YesGraphAPI){
        var superwidget = new Superwidget();
        YesGraphAPI.mount(superwidget);
        YesGraphAPI.Superwidget.init();
    });
}(jQuery));
