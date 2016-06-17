/*!
 * YesGraph Superwidget dev/__SUPERWIDGET_VERSION__
 *
 * https://www.yesgraph.com
 * https://docs.yesgraph.com/docs/superwidget
 * 
 * Date: __BUILD_DATE__
 */

(function () {
    "use strict";

    var VERSION = "dev/__SUPERWIDGET_VERSION__";
    var SDK_VERSION = "dev/__SDK_VERSION__";
    var CSS_VERSION = "dev/__CSS_VERSION__";
    var LIBRARY = {
        name: "yesgraph-invites.js",
        version: VERSION
    };
    var domReadyTimer = setInterval(function () {
        if (document.readyState === "complete" || document.readyState === "interactive") {
            loadSuperwidget();
            clearInterval(domReadyTimer);
        }
    }, 100);
    var EVENTS = {
        LOAD_SUPERWIDGET: "Loaded Superwidget",
        CLICK_CONTACT_IMPORT_BTN: "Clicked Contact Import Button",
        CLICK_SOCIAL_MEDIA_BTN: "Clicked Social Media Button",
        CLICK_COPY_LINK: "Clicked to Copy Invite Link"
    };

    function loadSuperwidget() {
        var protocol;
        if (window.location.protocol.indexOf("http") !== -1) {
            protocol = window.location.protocol;
        } else {
            protocol = "http:";
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
                    g.onload = function () {
                        func(window[globalVar]);
                    };
                }(document, 'script'));
            }
        }

        requireScript("YesGraphAPI", "https://cdn.yesgraph.com/" + SDK_VERSION + "/yesgraph.min.js", function (YesGraphAPI) {
            if (YesGraphAPI.hasLoadedSuperwidget) {
                YesGraphAPI.utils.error("Superwidget has been loaded multiple times.", false);
                return;
            } else {
                YesGraphAPI.hasLoadedSuperwidget = true;
            }
            var $ = window.jQuery; // Required by Karma tests
            requireScript("Clipboard", "https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/1.5.8/clipboard.min.js", function (Clipboard) {
                var target;
                var TESTMODE;
                var OPTIONS;
                // Sections of the widget UI
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
                var flashSection = $("<div>");
                var yesgraphCSS = $("<link>", {
                    "rel": "stylesheet",
                    "type": "text/css",
                    "charset": "utf-8",
                    "href": protocol + "//cdn.yesgraph.com/" + CSS_VERSION + "/yesgraph-invites.min.css"
                });
                var poweredByYesgraph = $("<span>", {
                    "id": "powered-by-yesgraph",
                    "text": "Powered by ",
                    "style": "display: block !important; visibility: visible !important; font-size: 12px !important; font-style: italic !important;"
                }).append($("<a>", {
                    "href": "https://www.yesgraph.com/demo?utm_source=superwidget&utm_medium=superwidget&utm_campaign=superwidget",
                    "text": "YesGraph",
                    "target": "_blank",
                    "style": "color: red !important; text-decoration: none !important;"
                }));

                // Build invite link section
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
                var copyInviteLinkBtn = $("<span>", {
                    "id": "yes-invite-link-copy-btn",
                    "data-clipboard-target": "#yes-invite-link",
                    "text": "Copy"
                }).css({
                    "display": "table-cell",
                    "border": "1px solid #ccc",
                    "border-left": "none",
                    "padding": "5px 7px",
                    "background-color": "#eee",
                    "cursor": "pointer"
                });
                var inviteLinkSection = $("<div>", {
                    "class": "yes-invite-link-section"
                }).css({
                    "display": "table",
                    "width": "100%",
                    "font-size": "0.85em",
                    "margin": "5px 0"
                }).append(inviteLinkInput, copyInviteLinkBtn);

                // If we haven't loaded the css already, add the YesGraph default styling
                // to the top of the page, so that any custom styles can still override it
                loadCssIfNotFound();
                function loadCssIfNotFound() {
                    var stylesheets = document.styleSheets;
                    var link;
                    var i;
                    for (i = 0; i < stylesheets.length; i += 1) {
                        link = stylesheets[i].href || "";
                        if (link.match(/yesgraph-invites[\S]*.css\b/)) {
                            return;
                        }
                    }
                    $("head").prepend(yesgraphCSS);
                }

                // Module for "flashing" stateful information
                // to the user (e.g., success, error, etc.)
                var flash = (function () {
                    function flashMessage(msg, type, duration) {
                        var flashDiv = $("<div>", {
                            "class": "yes-flash yes-flash-" + type,
                            "text": msg || ""
                        });
                        flashSection.append(flashDiv.hide());
                        flashDiv.show(300);

                        setTimeout(function () {
                            flashDiv.hide(300, function () {
                                $(this).remove();
                            });
                        }, duration || 3500);
                    }

                    function success(msg, duration) {
                        msg = msg || "Success!";
                        flashMessage(msg, "success", duration);
                    }

                    function error(msg, duration) {
                        msg = "Error: " + (msg || "Something went wrong.");
                        flashMessage(msg, "error", duration);
                    }

                    return {
                        success: success,
                        error: error
                    };
                }());

                var contactsModal = (function () {
                    var modal = $("<div>", {
                            "class": "yes-modal"
                        }),
                        overlay = $("<div>", {
                            "class": "yes-modal-overlay"
                        }),
                        loader = $("<div>", {
                            "class": "yes-loading-icon"
                        }),
                        isOpen = false,
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
                            "type": "checkbox"
                        }),
                        selectAllForm = $("<form>", {
                            "class": "yes-select-all-form"
                        }).append(selectAll, $("<label>", {
                            "text": "Select All"
                        }));

                    function init() {
                        var widgetCopy = OPTIONS.widgetCopy || {};

                        titleText = widgetCopy.contactsModalHeader || "Add Friends";
                        modalTitle.text(titleText);
                        modalHeader.append(modalTitle, modalCloseBtn);
                        modalBody.append(contactContainer);
                        modalFooter.append(modalSendBtn);
                        modal.append(modalHeader, modalBody, modalFooter);
                        $("body").append(overlay, modal);
                        applyStyling();

                        $(window).on("resize", centerModal);
                        modalCloseBtn.on("click", closeModal);
                        overlay.on("click", closeModal);
                        modalSendBtn.on("click", send);

                        selectAll.on("click", function (evt) {
                            modalBody.find("[type='checkbox']").prop("checked", $(evt.target).prop("checked"));
                            updateSendBtn();
                        });
                        modal.hide();
                        overlay.hide();
                    }

                    function updateSendBtn() {
                        // Updates the send button with a count of selected contacts
                        var btnText = '',
                            btnTextOptions = OPTIONS.widgetCopy.modalSendBtn || {},
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

                        if (contact.emails && contact.emails.length !== 0) {
                            var contactRow,
                                contactEmail,
                                checkbox,
                                emailCount = allEmails ? contact.emails.length : 1,
                                foundDuplicateRow,
                                suggestedEmails = $.map(suggestedList.find(".yes-contact-row-checkbox input"), function (elem) {
                                    return $(elem).data("email");
                                });

                            var i;
                            for (i = 0; i < emailCount; i += 1) {
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

                                    contactRow.append($('<div>', {
                                        class: "yes-contact-row-checkbox"
                                    }).append(checkbox));

                                    contactRow.append($('<div>', {
                                        class: "yes-contact-row-name"
                                    }).append($("<div>")));
                                    contactRow.append($('<div>', {
                                        class: "yes-contact-row-email"
                                    }).append($("<div>").append(contactEmail)));

                                    if (contact.name) {
                                        contactRow.find(".yes-contact-row-name").append($('<span>', {
                                            html: contact.name
                                        }));
                                    }

                                    checkbox.data("email", contact.emails[0]);
                                    checkbox.data("name", contact.name || undefined);
                                    checkbox.data("");
                                    contactRow.on("click", toggleSelected);

                                    target.append(contactRow);
                                }
                            }
                        }
                    }

                    function loadContacts(contacts, noSuggestions) {
                        // Wrapping and styling allows divs with unspecified
                        // heights to behave like scrollable tables
                        var innerWrapper = $("<div>", {
                            style: "height: 100%; position: relative; overflow: auto;"
                        }).append(totalList);
                        var wrappedTotalList = $("<div>", {
                            style: "height: 100%; display: table-cell; width: 100%;"
                        }).append(innerWrapper);
                        var wrappedSuggestedList = $("<div>", {
                            style: "max-height: 180px; overflow: scroll;"
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
                            var seenContacts = {entries: []};
                            var i;
                            var contact;
                            for (i = 0; i < suggestedContactCount; i += 1) {
                                contact = contacts[i];
                                if (contact.name) {
                                    seenContacts.entries.push({
                                        name: contact.name,
                                        emails: contact.emails,
                                        seen_at: new Date().toISOString()
                                    });
                                }
                                addRow(suggestedList, contact, false);
                            }
                            YesGraphAPI.postSuggestedSeen(seenContacts);
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

                        // Uppercase "Contains" is a case-insensitive
                        // version of jQuery "contains" used for doing
                        // case-insensitive searches
                        $.expr[':'].Contains = function (a, i, m) {
                            return jQuery(a).text().toUpperCase()
                                .indexOf(m[3].toUpperCase()) >= 0;
                        };

                        // Make the "Total" list searchable
                        searchField.on("input", function (evt) {
                            var searchString = evt.target.value,
                                matching_rows,
                                list;

                            totalList.find('.yes-contact-row').hide();
                            matching_rows = totalList.find('.yes-contact-row:Contains("' + searchString + '")');
                            matching_rows.show();
                            if (matching_rows.length === 0) {
                                noContactsWarning.show();
                            } else {
                                noContactsWarning.hide();
                            }
                        });

                        updateSendBtn();
                        applyStyling();
                    }

                    function applyStyling() {

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

                    function send(evt) {
                        try {
                            evt.preventDefault();
                        } catch (ignore) {}

                        modalSendBtn.prop("disabled", true);
                        var suggested = YesGraphAPI.utils.getSelectedRecipients(suggestedList),
                            alphabetical = YesGraphAPI.utils.getSelectedRecipients(totalList),
                            recipients = suggested.concat(alphabetical),
                            unique_recipients = [],
                            emails = [];

                        var i;
                        var recip;
                        recipients.forEach(function (recip, index, array) {
                            if (emails.indexOf(recip.email) === -1) {
                                emails.push(recip.email);
                                unique_recipients.push(recip);
                            }
                        });

                        YesGraphAPI.utils.sendEmailInvites(recipients)
                            .fail(function (data) {
                                flash.error("Email invite sending failed");
                                YesGraphAPI.utils.error("Email invite sending failed");
                            })
                            .always(function () {
                                modalSendBtn.prop("disabled", false);
                                closeModal();
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

                    return {
                        init: init,
                        isOpen: isOpen,
                        openModal: openModal,
                        closeModal: closeModal,
                        loadContacts: loadContacts,
                        loading: loading,
                        stopLoading: stopLoading,
                        container: modal
                    };
                }());

                var inviteWidget = (function () {

                    function init() {
                        var settings = YesGraphAPI.settings,
                            targetSelector = settings.target || ".yesgraph-invites";
                        TESTMODE = settings.testmode || false;

                        var sections = [containerHeader, containerBody];
                        if (settings.inviteLink) { sections.push(inviteLinkSection); }
                        if (settings.shareBtns) { sections.push(shareBtnSection); }

                        sections.push(flashSection);
                        container.append(sections);

                        if (OPTIONS.poweredByYesgraph) {
                            container.append(poweredByYesgraph);
                        }

                        var widgetCopy = OPTIONS.widgetCopy || {};
                        // Build container header
                        if (widgetCopy.widgetHeadline) {
                            var headline = $("<p>", {
                                "class": "yes-header-1",
                                "text": widgetCopy.widgetHeadline
                            });
                            containerHeader.append(headline);
                        }

                        $("#yes-invite-link-copy-btn").on("click", function() {
                            YesGraphAPI.AnalyticsManager.log(EVENTS.CLICK_COPY_LINK, null, null, LIBRARY);
                        });

                        var clipboard = new Clipboard('#yes-invite-link-copy-btn');
                        clipboard.on('success', function (e) {
                            var originalCopy = e.trigger.textContent;
                            e.trigger.textContent = "Copied!";
                            setTimeout(function () {
                                e.trigger.textContent = originalCopy;
                            }, 3000);
                        });
                        clipboard.on('error', function (e) {
                            var command = (navigator.userAgent.indexOf('Mac OS') !== -1) ? "Cmd + C" : "Ctrl + C";
                            flash.error("Clipboard access denied. Press " + command + " to copy.", 8000);
                        });

                        // Build share button section
                        buildShareButtons(shareBtnSection);

                        // Build container body
                        var manualInputForm = $('<form>', {
                                "class": "yes-manual-input-form"
                            }),
                            manualInputField = $("<textarea>", {
                                "rows": 3,
                                "class": "yes-manual-input-field"
                            }).prop("placeholder", widgetCopy.manual_input_placeholder || "Enter emails here"),
                            manualInputSubmit = $('<button>', {
                                "text": widgetCopy.manualInputSendBtn || "Add Emails",
                                "class": "yes-default-btn yes-manual-input-submit"
                            }),
                            includeOutlook = OPTIONS.settings.oauthServices.indexOf("outlook") !== -1,
                            includeGoogle = OPTIONS.settings.oauthServices.indexOf("google") !== -1,
                            includeYahoo = OPTIONS.settings.oauthServices.indexOf("yahoo") !== -1,
                            btnCount = 0 + Number(includeGoogle) + Number(includeYahoo) + (Number(includeOutlook) * 2),
                            contactImportSection = $("<div>", {
                                "class": "yes-contact-import-section"
                            }),
                            btnText = "";

                        manualInputForm.append(manualInputField, manualInputSubmit);

                        if (settings.contactImporting) { containerBody.append(contactImportSection); }
                        if (settings.emailSending) { containerBody.append(manualInputForm); }

                        contactsModal.init();

                        manualInputSubmit.on("click", function (evt) {
                            evt.preventDefault();
                            var recipients = YesGraphAPI.utils.getSelectedRecipients(manualInputField);
                            YesGraphAPI.utils.sendEmailInvites(recipients);
                            manualInputField.val("");
                        });

                        // Set up the contact importing buttons
                        if (OPTIONS.settings.oauthServices.length <= 1) {
                            btnText = (OPTIONS.widgetCopy.contactImportBtnCta || "Find friends") + " with ";
                        }
                        if (includeGoogle) {
                            var gmailBtn = generateContactImportBtn({
                                "id": "google",
                                "name": "Gmail"
                            });
                            contactImportSection.append(gmailBtn);

                            // Define oauth behavior for Gmail
                            gmailBtn.on("click", function (evt) {
                                // Attempt to auth gmail & pull contacts
                                evt.preventDefault();
                                gmail.authPopup().done(function () {
                                    contactsModal.openModal();
                                    contactsModal.loading();
                                    gmail.getContacts()
                                        .done(
                                            function (contacts) {
                                                rankContacts(contacts).done(function (contacts, noSuggestions) {
                                                    if (!contactsModal.isOpen) { contactsModal.openModal(); }
                                                    contactsModal.loadContacts(contacts, noSuggestions);
                                                }).fail(function (contacts) {
                                                    contactsModal.loadContacts(contacts, true);
                                                });
                                            }
                                        );
                                }).fail(function (data) {
                                    // Handle case where auth failed
                                    contactsModal.closeModal();
                                    contactsModal.stopLoading();
                                    flash.error(data.error);
                                    YesGraphAPI.utils.error(data.error);
                                });
                            });
                        }
                        if (includeOutlook) {
                            var outlookBtn = generateContactImportBtn({
                                    "id": "outlook",
                                    "name": "Outlook"
                                }),
                                hotmailBtn = generateContactImportBtn({
                                    "id": "hotmail",
                                    "name": "Hotmail"
                                });
                            contactImportSection.append(outlookBtn, hotmailBtn);

                            // Define oauth behavior for Outlook
                            outlookBtn.add(hotmailBtn).on("click", function (evt) {
                                // Attempt to auth & pull contacts
                                outlook.authPopup().done(function (contacts, noSuggestions) {
                                    if (!contactsModal.isOpen) { contactsModal.openModal(); }
                                    contactsModal.loadContacts(contacts, noSuggestions);
                                }).fail(function (data) {
                                    if (contactsModal.isOpen) { contactsModal.closeModal(); }
                                    flash.error($(this).prop("title") + " Authorization Failed.");
                                });
                            });
                        }

                        if (includeYahoo) {
                            var yahooBtn = generateContactImportBtn({
                                "id": "yahoo",
                                "name": "Yahoo"
                            });
                            contactImportSection.append(yahooBtn);

                            // Define oauth behavior for Yahoo
                            yahooBtn.on("click", function (evt) {
                                // Attempt to auth & pull contacts
                                yahoo.authPopup().done(function (contacts, noSuggestions) {
                                    if (!contactsModal.isOpen) { contactsModal.openModal(); }
                                    contactsModal.loadContacts(contacts, noSuggestions);
                                }).fail(function (data) {
                                    if (contactsModal.isOpen) { contactsModal.closeModal(); }
                                    flash.error("Yahoo Authorization Failed.");
                                });
                            });
                        }

                        $(targetSelector).append(container);
                        YesGraphAPI.Superwidget.isReady = true;
                        YesGraphAPI.Raven.captureBreadcrumb({
                            timestamp: new Date(),
                            message: "Superwidget Is Ready"
                        });

                        function generateContactImportBtn(service) {
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
                                    "class": btnClass + (btnCount > 3 ? " yes-no-label" : ""), // Only show the icon if there are more than 3 btns
                                    "title": service.name
                                }).append(outerWrapper);
                            btn.on("click", function(){
                                YesGraphAPI.AnalyticsManager.log(EVENTS.CLICK_CONTACT_IMPORT_BTN, null, null, LIBRARY);
                            });
                            return btn;
                        }
                    }

                    function getWidgetOptions() {
                        var d = $.Deferred(),
                            OPTIONS_ENDPOINT = '/apps/' + YesGraphAPI.app + '/js/get-options';
                        YesGraphAPI.hitAPI(OPTIONS_ENDPOINT, "GET").done(function (data) {
                            OPTIONS = data;
                            d.resolve(data);
                        }).fail(function (error) {
                            YesGraphAPI.utils.error(error.error + ". Please see the YesGraph SuperWidget Dashboard.", true);
                            d.reject(data);
                        });
                        return d.promise();
                    }

                    function rankContacts(contacts) {
                        var d = $.Deferred(),
                            noSuggestions;
                        YesGraphAPI.rankContacts(contacts)
                            .done(function (data) {
                                noSuggestions = Boolean(data.meta.exception_matching_email_domain);
                                d.resolve(data.data, noSuggestions);
                            }).fail(function (data) {
                                YesGraphAPI.utils.error("Contact ranking failed", false);
                                d.reject(contacts.entries);
                            });
                        return d.promise();
                    }

                    function buildShareButtons(target) {
                        if (OPTIONS.shareButtons.length === 0) { return false; }
                        var buttonsDiv = $("<div>"),
                            service,
                            targ,
                            shareBtn,
                            shareBtnIcon,
                            shareBtnText,
                            inviteLink = YesGraphAPI.inviteLink,
                            services = [{
                                "ID": "facebook",
                                "name": "Facebook",
                                "baseURL": "https://www.facebook.com/share.php",
                                "params": {
                                    u: encodeURI(inviteLink),
                                    title: OPTIONS.widgetCopy.shareMessage
                                },
                                "colors": ["#3B5998", "#324b81"]
                            }, {
                                "ID": "twitter",
                                "name": "Twitter",
                                "baseURL": "https://twitter.com/intent/tweet",
                                "params": {
                                    text: OPTIONS.widgetCopy.shareMessage + ' ' + inviteLink
                                },
                                "colors": ["#55ACEE", "#2E99EA"]
                            }, {
                                "ID": "linkedin",
                                "name": "LinkedIn",
                                "baseURL": "https://www.linkedin.com/shareArticle",
                                "params": {
                                    "mini": true,
                                    "url": inviteLink,
                                    "title": OPTIONS.appDisplayName,
                                    "summary": OPTIONS.widgetCopy.shareMessage
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

                        var wrapper;
                        services.forEach(function(service, index, array){
                            if (OPTIONS.shareButtons.indexOf(service.ID) !== -1) {
                                shareBtnIcon = $("<span>", {
                                    "class": "yes-share-btn-icon"
                                });
                                shareBtnText = $("<span>", {
                                    "text": service.name,
                                    "class": "yes-share-btn-text"
                                });

                                shareBtnIcon.css({
                                    "background-image": "url('" + protocol + "//cdn.yesgraph.com/" + service.ID + ".png')"
                                });

                                shareBtn = $("<span>", {
                                    "class": "yes-share-btn yes-share-btn-" + service.ID,
                                    "data-name": service.name,
                                    "data-url": service.baseURL + "?" + $.param(service.params),
                                    "data-color": service.colors[0],
                                    "data-hover-color": service.colors[1]
                                });

                                shareBtn.css({
                                    "background-color": service.colors[0]
                                });

                                shareBtn.hover(shareBtnHoverOnHandler, shareBtnHoverOffHandler);

                                shareBtn.append(shareBtnIcon, shareBtnText);

                                // Handle Pinterest slightly differently
                                if (service.ID === "pinterest") {
                                    wrapper = $("<a>", {
                                        "href": service.baseURL + "?" + $.param(service.params),
                                        "data-pin-do": "buttonBookmark",
                                        "data-pin-custom": true
                                    }).append(shareBtn);

                                    shareBtn.on("click", function () {
                                        // Do this on each click. Otherwise images added
                                        // asynchronously (e.g., by Intercom) will not
                                        // have the desired description when pinned.
                                        $("img").not("[data-pin-description]").each(function () {
                                            this.dataset.pinDescription = OPTIONS.integrations.twitter.tweetMsg + " " + inviteLink;
                                        });
                                        YesGraphAPI.AnalyticsManager.log(EVENTS.CLICK_SOCIAL_MEDIA_BTN, null, null, LIBRARY);
                                        wrapper[0].click();
                                    });

                                    requireScript("pinUtils", protocol + "//assets.pinterest.com/js/pinit.js", function () { // jshint ignore:line
                                        buttonsDiv.append(wrapper.append(shareBtn));
                                    });

                                } else {
                                    shareBtn.on("click", function (evt) {
                                        targ = $(this);
                                        open(targ.data("url"), "Share on " + targ.data("name"), 'width=550, height=550');
                                        YesGraphAPI.AnalyticsManager.log(EVENTS.CLICK_SOCIAL_MEDIA_BTN, null, null, LIBRARY);
                                    });
                                    buttonsDiv.append(shareBtn);
                                }
                            }
                        });

                        function shareBtnHoverOnHandler () {
                            var $this = $(this); // jshint ignore:line
                            $this.css("background-color", $this.data("hover-color"));
                        }
                        function shareBtnHoverOffHandler () {
                            var $this = $(this); // jshint ignore:line
                            $this.css("background-color", $this.data("color"));
                        }
                        target.append(buttonsDiv);
                    }

                    return {
                        init: function () {
                            getWidgetOptions().done(init);
                        }
                    };
                }());

                // Module for the Yahoo oauth flow & contact importing
                var yahoo = (function () {

                    function authPopup() {
                        // Open the Yahoo OAuth popup & retrieve the access token from it
                        var d = $.Deferred(),
                            oauthInfo = getOAuthInfo(),
                            url = oauthInfo[0],
                            redirect = oauthInfo[1],
                            msg,
                            win = open(url, "Yahoo Authorization", 'width=900, height=700'),
                            count = 0,
                            token,
                            pollTimer = setInterval(function () {
                                try {
                                    if (win.document.URL.indexOf(redirect) !== -1) {
                                        // Stop waiting & resolve or reject with results
                                        var responseUrl = win.document.URL,
                                            errorType = getUrlParam(responseUrl, "error"),
                                            errorDescription = getUrlParam(responseUrl, "error_description"),
                                            accessToken = getUrlParam(responseUrl, "access_token");
                                        clearInterval(pollTimer);
                                        win.close();

                                        if (accessToken) {
                                            contactsModal.loading();
                                            // Get and rank contacts server-side
                                            var tokenData = {
                                                access_token: accessToken
                                            };
                                            if (errorType) {
                                                tokenData.error = errorType;
                                                tokenData.error_description = errorDescription;
                                            }
                                            YesGraphAPI.hitAPI("/oauth", "GET", {
                                                "service": "yahoo",
                                                "token_data": JSON.stringify(tokenData)
                                            }).done(function (response) {
                                                if (response.error) {
                                                    d.reject(response);
                                                } else {
                                                    $(document).trigger(YesGraphAPI.events.IMPORTED_CONTACTS, [{
                                                            name: undefined,
                                                            email: undefined,
                                                            type: "yahoo"
                                                        }, response.data.raw_contacts ]);
                                                    var noSuggestions = Boolean(response.meta.exception_matching_email_domain);
                                                    d.resolve(response.data.ranked_contacts, noSuggestions);
                                                }
                                            }).fail(function (response) {
                                                d.reject(response);
                                            });
                                        } else {
                                            d.reject({
                                                error: OUTLOOK_FAILED_MSG
                                            });
                                            msg = errorDescription ? errorType + " - " + errorDescription.replace(/\+/g, " ") : errorType;
                                            YesGraphAPI.utils.error(msg);
                                        }
                                    }
                                } catch (e) {
                                    var okErrorMessages = [
                                            "Cannot read property 'URL' of undefined",
                                            "undefined is not an object (evaluating 'win.document.URL')",
                                            'Permission denied to access property "document"'
                                        ],
                                        canIgnoreError = (okErrorMessages.indexOf(e.message) !== -1 || e.code === 18);

                                    if (count >= 1000 || !canIgnoreError) {
                                        msg = canIgnoreError ? e.message : OUTLOOK_FAILED_MSG;
                                        YesGraphAPI.utils.error(msg, false);
                                        d.reject({
                                            "error": msg
                                        });
                                        win.close();
                                        clearInterval(pollTimer);
                                    }
                                    count++;
                                }
                            }, 100);

                        function getOAuthInfo() {
                            var REDIRECT;
                            if (window.location.hostname === "localhost" || OPTIONS.integrations.yahoo.usingDefaultCredentials) {
                                REDIRECT = window.location.origin;
                            } else {
                                REDIRECT = OPTIONS.integrations.yahoo.redirectUrl;
                            }

                            var authUrl = "https://api.login.yahoo.com/oauth2/request_auth?";
                            var params = {
                                response_type: "token",
                                client_id: OPTIONS.integrations.yahoo.clientId,
                                redirect_uri: OPTIONS.integrations.yahoo.redirectUrl,
                                state: window.location.href
                            };
                            var fullUrl = authUrl + $.param(params);
                            return [fullUrl, REDIRECT];
                        }

                        return d.promise();
                    }
                    return {
                        authPopup: authPopup
                    };
                }());

                // Module for the Outlook oauth flow & contact importing
                var outlook = (function () {
                    var OUTLOOK_ACCESS_TOKEN,
                        readContactsScope = "https://outlook.office.com/contacts.read",
                        OUTLOOK_FAILED_MSG = "Outlook Authorization Failed";

                    function authPopup() {
                        // Open the Outlook OAuth popup & retrieve the access token from it
                        var d = $.Deferred(),
                            oauthInfo = getOAuthInfo(),
                            url = oauthInfo[0],
                            msg,
                            redirect = oauthInfo[1],
                            win = open(url, "Outlook Authorization", 'width=900, height=700'),
                            count = 0,
                            token,
                            pollTimer = setInterval(function () {
                                try {
                                    if (win.document.URL.indexOf(redirect) !== -1) {
                                        // Stop waiting & resolve or reject with results
                                        var responseUrl = win.document.URL,
                                            errorType = getUrlParam(responseUrl, "error"),
                                            errorDescription = getUrlParam(responseUrl, "error_description"),
                                            accessToken = getUrlParam(responseUrl, "access_token");
                                        clearInterval(pollTimer);
                                        win.close();

                                        if (accessToken) {
                                            contactsModal.loading();
                                            // Get and rank contacts server-side
                                            var tokenData = {
                                                access_token: accessToken
                                            };
                                            if (errorType) {
                                                tokenData.error = errorType;
                                                tokenData.error_description = errorDescription;
                                            }
                                            YesGraphAPI.hitAPI("/oauth", "GET", {
                                                "service": "outlook",
                                                "token_data": JSON.stringify(tokenData)
                                            }).done(function (response) {
                                                if (response.error) {
                                                    d.reject(response);
                                                } else {
                                                    $(document).trigger(YesGraphAPI.events.IMPORTED_CONTACTS, [{
                                                        name: undefined,
                                                        email: undefined,
                                                        type: "outlook"
                                                    }, response.data.raw_contacts ]);
                                                    var noSuggestions = Boolean(response.meta.exception_matching_email_domain);
                                                    d.resolve(response.data.ranked_contacts, noSuggestions);
                                                }
                                            }).fail(function (response) {
                                                d.reject(response);
                                            });
                                        } else {
                                            d.reject({
                                                error: OUTLOOK_FAILED_MSG
                                            });
                                            msg = errorDescription ? errorType + " - " + errorDescription.replace(/\+/g, " ") : errorType;
                                            YesGraphAPI.utils.error(msg);
                                        }
                                    }
                                } catch (e) {
                                    var okErrorMessages = [
                                            "Cannot read property 'URL' of undefined",
                                            "undefined is not an object (evaluating 'win.document.URL')",
                                            'Permission denied to access property "document"'
                                        ],
                                        canIgnoreError = (okErrorMessages.indexOf(e.message) !== -1 || e.code === 18);

                                    if (count >= 1000 || !canIgnoreError) {
                                        msg = canIgnoreError ? e.message : OUTLOOK_FAILED_MSG;
                                        YesGraphAPI.utils.error(msg, false);
                                        d.reject({
                                            "error": msg
                                        });
                                        win.close();
                                        clearInterval(pollTimer);
                                    }
                                    count++;
                                }
                            }, 100);


                        function getOAuthInfo() {
                            var REDIRECT;
                            if (window.location.hostname === "localhost" || OPTIONS.integrations.outlook.usingDefaultCredentials) {
                                REDIRECT = window.location.origin;
                            } else {
                                REDIRECT = OPTIONS.integrations.outlook.redirectUrl;
                            }

                            var authUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?";
                            var params = {
                                response_type: "token",
                                client_id: OPTIONS.integrations.outlook.clientId,
                                state: window.location.href,
                                redirect_uri: OPTIONS.integrations.outlook.redirectUrl
                            };
                            var scope = concatScopes([readContactsScope]);
                            var fullUrl = authUrl + $.param(params) + "&scope=" + scope;
                            return [fullUrl, REDIRECT];
                        }

                        function concatScopes(scopes) {
                            var escaped_scopes = [];
                            scopes.forEach(function(scope){
                                escaped_scopes.push(encodeURIComponent(scope));
                            });
                            return escaped_scopes.join("+");
                        }

                        return d.promise();
                    }

                    return {
                        authPopup: authPopup
                    };
                }());


                // Module for all of our gmail functionality
                // (e.g., OAuth, contact importing, etc.)
                var gmail = (function () {
                    var GMAIL_ACCESS_TOKEN;
                    function getContacts() {
                        var d = $.Deferred();
                        var contactsFeedUrl = 'https://www.google.com/m8/feeds/contacts/default/full?max-results=1000000';
                        var readContactsScope = 'https://www.googleapis.com/auth/contacts.readonly';

                        var queryParams = {
                            access_token: GMAIL_ACCESS_TOKEN,
                            alt: 'json',
                            orderby: 'lastmodified'
                        };

                        $.ajax({
                            url: contactsFeedUrl,
                            data: queryParams,
                            dataType: "jsonp",
                            success: function (rawContacts) {
                                var contacts = parseContactsFeed(rawContacts.feed);
                                $(document).trigger(YesGraphAPI.events.IMPORTED_CONTACTS, [contacts.source, rawContacts]);
                                d.resolve(contacts);
                            },
                            error: function (data) {
                                d.reject();
                            }
                        });
                        return d.promise();
                    }

                    function parseContactsFeed(contactsFeed) {
                        var entries = [],
                            yesgraphEntry,
                            emails;

                        contactsFeed.entry.forEach(function (googleEntry, index, array) {
                            yesgraphEntry = {};
                            if (googleEntry.title.$t) {
                                yesgraphEntry.name = googleEntry.title.$t;
                            }

                            if (googleEntry.gd$email) {
                                yesgraphEntry.emails = [];

                                googleEntry.gd$email.forEach(function (email, index, array) {
                                    yesgraphEntry.emails.push(googleEntry.gd$email[index].address);
                                });
                            }
                            entries.push(yesgraphEntry);
                        });

                        var contacts = {
                            source: {
                                type: 'gmail',
                                name: contactsFeed.author[0].name.$t,
                                email: contactsFeed.author[0].email.$t
                            },
                            entries: entries
                        };
                        return contacts;
                    }

                    function authPopup() {
                        // Open the Google OAuth popup & retrieve the access token from it
                        var d = $.Deferred(),
                            url = getOAuthInfo()[0],
                            redirect = getOAuthInfo()[1],
                            win = open(url, "Google Authorization", 'width=550, height=550'),
                            count = 0,
                            token,
                            pollTimer = setInterval(function () {
                                try {
                                    if (win.document.URL.indexOf(redirect) !== -1) {
                                        // Stop waiting & resolve or reject with results
                                        var responseUrl = win.document.URL;
                                        var errorMessage = getUrlParam(responseUrl, "error");
                                        token = getUrlParam(responseUrl, "access_token");

                                        if (token) {
                                            GMAIL_ACCESS_TOKEN = token;
                                            d.resolve({
                                                token: GMAIL_ACCESS_TOKEN,
                                                type: getUrlParam(responseUrl, "token_type"),
                                                expires_in: getUrlParam(responseUrl, "expires_in")
                                            });
                                            clearInterval(pollTimer);
                                            win.close();
                                        } else if (errorMessage === "access_denied") {
                                            d.reject({
                                                "error": "Access Denied"
                                            });
                                            clearInterval(pollTimer);
                                            win.close();
                                        }
                                        // If access was neither granted nor denied, keep waiting.
                                        // This occurs in some versions of Safari before the oauth
                                        // flow occurs, so we should keep polling in those cases.
                                    }
                                } catch (e) {
                                    var okErrorMessages = [
                                            "Cannot read property 'URL' of undefined",
                                            "undefined is not an object (evaluating 'win.document.URL')",
                                            'Permission denied to access property "document"'
                                        ],
                                        canIgnoreError = (okErrorMessages.indexOf(e.message) !== -1 || e.code === 18);

                                    if (count >= 1000 || !canIgnoreError) {
                                        var msg = e.message;
                                        if (canIgnoreError) {
                                            msg = "Gmail authorization failed.";
                                        }
                                        YesGraphAPI.utils.error(msg, false);
                                        d.reject({
                                            error: msg
                                        });
                                        win.close();
                                        clearInterval(pollTimer);
                                    }
                                    count++;
                                }
                            }, 100);

                        function getOAuthInfo() {
                            var REDIRECT;
                            var localHostnames = ["localhost", "lvh.me"];
                            if (localHostnames.indexOf(window.location.hostname) !== -1 || OPTIONS.integrations.google.usingDefaultCredentials) {
                                REDIRECT = window.location.origin;
                            } else {
                                REDIRECT = OPTIONS.integrations.google.redirectUrl;
                            }

                            var params = {
                                response_type: "token",
                                client_id: OPTIONS.integrations.google.clientId,
                                state: window.location.href,
                                redirect_uri: OPTIONS.integrations.google.redirectUrl
                            };
                            var scope = concatScopes(["https://www.google.com/m8/feeds/",
                                "https://www.googleapis.com/auth/userinfo.email"
                            ]);
                            var fullUrl = "https://accounts.google.com/o/oauth2/auth?" + $.param(params) + "&scope=" + scope;
                            return [fullUrl, REDIRECT];
                        }

                        function concatScopes(scopes) {
                            var escaped_scopes = [];
                            scopes.forEach(function(scope){
                                escaped_scopes.push(encodeURIComponent(scope));
                            });
                            return escaped_scopes.join("+");
                        }

                        return d.promise();
                    }

                    return {
                        authPopup: authPopup,
                        getContacts: getContacts
                    };
                }());

                // Helper functions

                function waitForAPIConfig() {
                    var d = $.Deferred();
                    var timer = setInterval(function () {
                        if (YesGraphAPI.isReady) {
                            clearInterval(timer);
                            inviteLinkInput.val(YesGraphAPI.inviteLink);
                            YesGraphAPI.isTestMode = isTestMode;
                            YesGraphAPI.Raven.setTagsContext({
                                superwidget_version: VERSION,
                                css_version: CSS_VERSION
                            });
                            // Add custom superwidget events
                            YesGraphAPI.events = $.extend(YesGraphAPI.events, {
                                SET_RECIPIENTS: "set.yesgraph.recipients",
                                IMPORTED_CONTACTS: "imported.yesgraph.contacts"
                            });
                            d.resolve();
                        }
                    }, 100);
                    return d.promise();
                }

                YesGraphAPI.utils.getSelectedRecipients = function(elem) {
                    var recipients = [],
                        recipient,
                        emails,
                        email;

                    if (elem.is("textarea")) {
                        emails = elem.val().split(",");
                        emails.forEach(function (email, index, array){
                            email = email.replace(/^\s+|\s+$/g, ''); // strip whitespace
                            if (email) {
                                if (isValidEmail(email)) {
                                    recipients.push({
                                        "email": email
                                    });
                                } else {
                                    flash.error('Invalid email "' + email + '".');
                                }
                            }
                        });
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
                };

                YesGraphAPI.utils.sendEmailInvites = function(recipients) {
                    var d = $.Deferred();
                    var msg;
                    if (!recipients || recipients.length < 1) {
                        msg = "No valid recipients specified.";
                        flash.error(msg);
                        d.reject({
                            error: msg
                        }); // invalid user input

                    } else {
                        // Event only fires if there are valid recipients
                        $(document).trigger(YesGraphAPI.events.SET_RECIPIENTS, [recipients]);

                        // Only send the emails if emailSending was not set to `false`
                        if (YesGraphAPI.settings.emailSending) {

                            if (validateSettings(OPTIONS.settings || {})) {
                                YesGraphAPI.hitAPI("/send-email-invites", "POST", {
                                    recipients: recipients,
                                    test: TESTMODE || undefined,
                                    invite_link: YesGraphAPI.inviteLink

                                }).done(function (resp) {
                                    if (!resp.emails) {
                                        d.reject(resp);
                                        flash.error(resp);
                                        YesGraphAPI.utils.error(resp);
                                    } else {
                                        if (TESTMODE) {
                                            flash.success("Testmode: emails not sent.");
                                        } else {
                                            var invites = {
                                                entries: []
                                            };
                                            resp.sent.forEach(function(inviteData){
                                                invites.entries.push({
                                                    "invitee_name": inviteData[0] || undefined,
                                                    "email": inviteData[1],
                                                    "sent_at": new Date().toISOString()
                                                });
                                            });
                                            YesGraphAPI.postInvitesSent(invites);
                                        }
                                        d.resolve();
                                    }

                                }).fail(function (data) {
                                    flash.error(data.error);
                                    YesGraphAPI.utils.error(data.error, false);
                                    d.reject(data);
                                });

                            } else {
                                d.reject();  // invalid settings
                            }
                        } else {
                            d.resolve();  // email sending turned off
                        }

                        d.done(function () {
                            msg = "You've added " + recipients.length;
                            msg += recipients.length === 1 ? " friend!" : " friends!";
                            flash.success(msg);
                        });
                    }
                    return d.promise();
                };

                function getUrlParam(url, name) {
                    name = name.replace(new RegExp("/[[]/"), "\[").replace(new RegExp("/[]]/"), "\]");
                    var regexS = "[\?&#]" + name + "=([^&#]*)";
                    var regex = new RegExp(regexS);
                    var results = regex.exec(url);
                    return results == null ? null : results[1]; // jshint ignore:line
                }

                function isValidEmail(email) {
                    var re = /[A-Z0-9._%+\-]+@[A-Z0-9.\-]+.[A-Z]{2,4}/igm;
                    return re.test(email);
                }

                function isTestMode(bool) {
                    if (typeof bool === "boolean") {
                        TESTMODE = bool;
                    }
                    return TESTMODE;
                }

                function validateSettings(settings) {
                    var settingsAreValid, settingsErrors;
                    if (settings.hasValidEmailSettings !== undefined) {
                        settingsAreValid = settings.hasValidEmailSettings[0];
                        settingsErrors = settings.hasValidEmailSettings[1];
                    } else {
                        settingsAreValid = settings.hasEmailTemplate && settings.hasSendGridApiKey;
                    }
                    if (!settingsAreValid) {
                        flash.error(settingsErrors);
                    }
                    return settingsAreValid;
                }


                // Initialize Superwidget config
                YesGraphAPI.Superwidget = {
                    isReady: false,
                    container: container,
                    modal: contactsModal
                };

                // Main functionality
                waitForAPIConfig().then(inviteWidget.init);
            }); // requireScript Clipboard.js
        }); // requireScript YesGraphAPI
    }
}());
