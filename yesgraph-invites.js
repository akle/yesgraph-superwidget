! function() {
    var domReadyTimer = setInterval(function() {
        if (document.readyState === "complete" || document.readyState === "interactive") {
            loadSuperwidget();
            clearInterval(domReadyTimer);
        }
    }, 100);

    function loadSuperwidget() {
        var protocol = window.location.protocol.indexOf("http") !== -1 ? window.location.protocol : "http:";

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
            }
        }

        withScript("jQuery", "https://code.jquery.com/jquery-2.1.1.min.js", function($) {
            withScript("YesGraphAPI", "https://cdn.yesgraph.com/yesgraph.min.js", function(YesGraphAPI) { // FIXME
                if (YesGraphAPI.hasLoadedSuperwidget) {
                    YesGraphAPI.error("Superwidget has been loaded multiple times.", false);
                    return;
                } else {
                    YesGraphAPI.hasLoadedSuperwidget = true;
                }

                withScript("Clipboard", "https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/1.5.8/clipboard.min.js", function(Clipboard) {
                    var APP_NAME,
                        target,
                        TESTMODE,
                        YESGRAPH_BASE_URL = (window.location.hostname === 'localhost' && window.document.title === 'YesGraph') ? 'http://localhost:5001' : 'https://www.yesgraph.com',
                        // Sections of the widget UI
                        container = $("<div>", {
                            "class": "yes-widget-container"
                        }),
                        containerHeader = $("<div>", {
                            "class": "yes-header-1"
                        }),
                        containerBody = $("<div>"),
                        shareBtnSection = $("<div>", {
                            "class": "yes-share-btn-section"
                        }),
                        flashSection = $("<div>"),
                        yesgraphCSS = $("<link>", {
                            "rel": "stylesheet",
                            "type": "text/css",
                            "charset": "utf-8",
                            "href": protocol + "//cdn.yesgraph.com/yesgraph-invites.min.css"
                        }),
                        poweredByYesgraph = $("<span>", {
                            "id": "powered-by-yesgraph",
                            "text": "Powered by ",
                            "style": "display: block !important; visibility: visible !important; font-size: 12px !important; font-style: italic !important;"
                        }).append($("<a>", {
                            "href": "https://www.yesgraph.com/demo",
                            "text": "YesGraph",
                            "target": "_blank",
                            "style": "color: red !important; text-decoration: none !important;"
                        })),

                        // Build invite link section
                        inviteLinkInput = $("<input>", {
                            "readonly": true,
                            "id": "yes-invite-link"
                        }).css({
                            "width": "100%",
                            "border": "1px solid #ccc",
                            "text-overflow": "ellipsis",
                            "padding": "5px 7px"
                        }).on("click", function() {
                            this.select();
                        }),
                        copyInviteLinkBtn = $("<span>", {
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
                        }),
                        inviteLinkSection = $("<div>", {
                            "class": "yes-invite-link-section"
                        }).css({
                            "display": "table",
                            "width": "100%",
                            "font-size": "0.85em",
                            "margin": "5px 0"
                        }).append(inviteLinkInput, copyInviteLinkBtn);

                    // Add the YesGraph default styling to the top of the page,
                    // so that any custom styles can still override it
                    $("head").prepend(yesgraphCSS);

                    // Module for "flashing" stateful information
                    // to the user (e.g., success, error, etc.)
                    var flash = (function() {
                        function flashMessage(msg, type, duration) {
                            var flashDiv = $("<div>", {
                                "class": "yes-flash yes-flash-" + type,
                                "text": msg || ""
                            });
                            flashSection.append(flashDiv.hide());
                            flashDiv.show(300);

                            setTimeout(function() {
                                flashDiv.hide(300, function() {
                                    delete $(this);
                                });
                            }, duration || 3500);
                        }

                        function success(msg, duration) {
                            msg = msg || "Success!"
                            flashMessage(msg, "success", duration);
                        }

                        function error(msg, duration) {
                            msg = "Error: " + (msg || "Something went wrong.");
                            flashMessage(msg, "error", duration);
                        }

                        return {
                            success: success,
                            error: error,
                        }
                    }());

                    var contactsModal = (function() {
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

                        function init(options) {
                            var widgetCopy = options.widgetCopy || {};

                            titleText = widgetCopy.contactsModalHeader || "Add Friends";
                            modalTitle.text(titleText)
                            modalHeader.append(modalTitle, modalCloseBtn);
                            modalBody.append(contactContainer);
                            modalFooter.append(modalSendBtn);
                            modal.append(modalHeader, modalBody, modalFooter);
                            $("body").append(overlay, modal);
                            applyStyling();

                            $(window).on("resize", centerModal);
                            modalCloseBtn.on("click", closeModal);
                            overlay.on("click", closeModal);

                            modalSendBtn.on("click", function() {
                                validateSettings(options.settings || {}) ? send() : closeModal();
                            });

                            selectAll.on("click", function(evt) {
                                modalBody.find("[type='checkbox']").prop("checked", $(evt.target).prop("checked"));
                                updateSendBtn();
                            });
                            modal.hide();
                            overlay.hide();
                        }

                        function updateSendBtn() {
                            // Updates the send button with a count of selected contacts
                            var btnText = '',
                                checked = modalBody.find('input[type="checkbox"]').filter(function() {
                                    return Boolean($(this).prop("checked"));
                                });

                            if (checked.length === 0) {
                                var btnText = "No contacts selected";
                            } else if (checked.length === 1) {
                                var btnText = "Send to 1 contact";
                            } else {
                                var btnText = "Send to " + checked.length + " contacts";
                            };
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
                                    suggestedEmails = $.map(suggestedList.find(".yes-contact-row-checkbox input"), function(elem, i) {
                                        return $(elem).data("email");
                                    });

                                for (var i = 0; i < emailCount; i++) {
                                    // Check if they're also in the suggested list
                                    if (suggestedEmails.indexOf(contact.emails[i]) !== -1) {
                                        continue;
                                    };

                                    contactEmail = $("<span>", {
                                        text: contact.emails[i]
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
                                    }));
                                    contactRow.append($('<div>', {
                                        class: "yes-contact-row-email"
                                    }).append(contactEmail));

                                    if (contact.name) contactRow.children().eq(1).append($('<span>', {
                                        text: contact.name
                                    }));

                                    checkbox.data("email", contact.emails[0]);
                                    checkbox.data("name", contact.name || undefined);
                                    checkbox.data("")
                                    contactRow.on("click", toggleSelected);

                                    target.append(contactRow);
                                }
                            }
                        }

                        function loadContacts(contacts, noSuggestions) {
                            // Wrapping and styling allows divs with unspecified
                            // heights to behave like scrollable tables
                            var innerWrapper = $("<div>", {
                                    style: "height: 100%; position: relative; overflow: auto;"
                                }).append(totalList),
                                wrappedTotalList = $("<div>", {
                                    style: "height: 100%; display: table-cell; width: 100%;"
                                }).append(innerWrapper),
                                wrappedSuggestedList = $("<div>", {
                                    style: "max-height: 180px; overflow: scroll;"
                                }).append(suggestedList),
                                noContactsWarning = $("<p>", {
                                    "text": "None found!",
                                    "class": "yes-none-found-warning"
                                }),
                                suggestedContactCount = 5;

                            if (contacts.length === 0) {
                                stopLoading();
                                modalTitle.text("No contacts found!");
                                modalSendBtn.css("visibility", "hidden");
                                return;
                            };

                            // Suggested Contacts
                            if (!noSuggestions) {
                                var seenContacts = { entries: [] };
                                for (var i = 0; i < suggestedContactCount; i++) {
                                    contact = contacts[i];
                                    if (contact.name) {
                                        seenContacts.entries.push({
                                            name: contact.name,
                                            emails: contact.emails,
                                            seen_at: new Date().toISOString()
                                        });
                                    }
                                    addRow(suggestedList, contact, false);
                                };
                                YesGraphAPI.postSuggestedSeen(seenContacts);
                            }

                            // Total Contacts (Alphabetical)
                            function compareContacts(a, b) {
                                if (a.name && b.name) {
                                    return a.name <= b.name ? -1 : 1;
                                } else if (!a.name && !b.name) {
                                    if (!a.emails || !b.emails) return 0;
                                    return a.emails[0] <= b.emails[0] ? -1 : 1;
                                }
                                return Boolean(b.name) - Boolean(a.name);
                            }

                            var sortedContacts = contacts.sort(compareContacts);

                            for (var i = 0; i < sortedContacts.length; i++) {
                                contact = sortedContacts[i];
                                addRow(totalList, contact, true);
                            };

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
                            $.expr[':'].Contains = function(a, i, m) {
                                return jQuery(a).text().toUpperCase()
                                    .indexOf(m[3].toUpperCase()) >= 0;
                            };

                            // Make the "Total" list searchable
                            searchField.on("input", function(evt) {
                                var searchString = evt.target.value,
                                    matching_rows,
                                    list;

                                totalList.find('.yes-contact-row').hide();
                                matching_rows = totalList.find('.yes-contact-row:Contains("' + searchString + '")');
                                matching_rows.show();
                                if (matching_rows.length === 0) {
                                    noContactsWarning.show()
                                } else {
                                    noContactsWarning.hide();
                                };
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
                                "right": "0",
                            });

                            $(".yes-contact-list-header").css({
                                "display": "table-row",
                                "font-size": "16px",
                                "font-weight": "bolder",
                                "height": "30px",
                                "line-height": "30px",
                                "margin": "0",
                            })
                        }

                        function send(evt) {
                            try {
                                evt.preventDefault();
                            } catch (e) {};
                            modalSendBtn.prop("disabled", true);
                            var suggested = getSelectedRecipients(suggestedList),
                                alphabetical = getSelectedRecipients(totalList),
                                recipients = suggested.concat(alphabetical),
                                unique_recipients = [],
                                emails = [];

                            for (i in recipients) {
                                var recip = recipients[i];
                                if (emails.indexOf(recip.email) === -1) {
                                    emails.push(recip.email);
                                    unique_recipients.push(recip);
                                };
                            };
                            sendEmailInvites(recipients)
                                .fail(function(data) {
                                    flash.error("Email invite sending failed");
                                    YesGraphAPI.error("Email invite sending failed");
                                })
                                .always(function() {
                                    modalSendBtn.prop("disabled", false);
                                    closeModal();
                                });
                        }

                        function openModal(evt) {
                            try {
                                evt.preventDefault();
                            } catch (e) {};
                            modal.show();
                            centerModal();
                            overlay.show();
                            isOpen = true;
                        }

                        function closeModal(evt) {
                            try {
                                evt.preventDefault();
                            } catch (e) {};
                            modal.hide();
                            overlay.hide();
                            isOpen = false;
                        }

                        function centerModal(evt) {
                            try {
                                evt.preventDefault();
                            } catch (e) {};
                            var top, left;
                            top = Math.max($(window).height() - modal.outerHeight(), 0) / 2;
                            left = Math.max($(window).width() - modal.outerWidth(), 0) / 2;

                            modal.css({
                                top: top + $(window).scrollTop(),
                                left: left + $(window).scrollLeft()
                            });
                        }

                        function loading() {
                            overlay.show();
                            // Detach items that we might need to re-attach later
                            // Remove items that we won't re-use
                            var itemsToDetach = contactContainer.children(),
                                itemsToRemove = $(".yes-contact-row").add(".yes-none-found-warning");
                            itemsToDetach.detach();
                            itemsToRemove.remove();

                            modalSendBtn.css("visibility", "hidden");
                            modalTitle.text("Loading contacts...");
                            loader.css("display", "block");
                            modal.show()
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
                            stopLoading: stopLoading
                        }
                    }());

                    var inviteWidget = (function() {

                        function init(options) {
                            target = $(".yesgraph-invites");
                            TESTMODE = ["True", "true", true, "1", 1].indexOf(target.data("testmode")) !== -1 ? true : false;

                            target.append(container);
                            container.append(containerHeader, containerBody, inviteLinkSection, shareBtnSection, flashSection);

                            if (options.poweredByYesgraph) {
                                container.append(poweredByYesgraph);
                            };

                            var widgetCopy = options.widgetCopy || {};
                            // Build container header
                            if (widgetCopy.widgetHeadline) {
                                var headline = $("<p>", {
                                    "class": "yes-header-1",
                                    "text": widgetCopy.widgetHeadline
                                });
                                containerHeader.append(headline);
                            };

                            var clipboard = new Clipboard('#yes-invite-link-copy-btn');
                            clipboard.on('success', function(e) {
                                var originalCopy = e.trigger.textContent;
                                e.trigger.textContent = "Copied!";
                                setTimeout(function() {
                                    e.trigger.textContent = originalCopy
                                }, 3000);
                            });
                            clipboard.on('error', function(e) {
                                var command = (navigator.userAgent.indexOf('Mac OS') !== -1) ? "Cmd + C" : "Ctrl + C";
                                flash.error("Clipboard access denied. Press " + command + " to copy.", 8000);
                            });

                            // Build share button section
                            buildShareButtons(shareBtnSection, options);

                            // Build container body
                            var manualInputForm = $('<form>', {
                                "class": "yes-manual-input-form"
                            }),
                                manualInputField = $("<textarea>", {
                                    "placeholder": "john@example.com, jane@example.com",
                                    "rows": 4,
                                    "class": "yes-manual-input-field",
                                }),
                                manualInputSubmit = $('<button>', {
                                    "text": widgetCopy.manualInputSendBtn || "Add Emails",
                                    "class": "yes-default-btn yes-manual-input-submit",
                                }),
                                gmailIcon = $("<div>", {
                                    "style": "background-image: url('" + protocol + "//cdn.yesgraph.com/gmail.png')",
                                    "class": "yes-contact-import-btn-icon",
                                }),
                                gmailBtnText = $("<span>", {
                                    "text": (widgetCopy.contactImportBtnCta || "Find Friends") + " with Gmail",
                                    "class": "yes-contact-import-btn-text",
                                }),
                                gmailBtnInnerWrapper = $("<div>").css("display", "table").append(gmailIcon, gmailBtnText),
                                gmailBtnOuterWrapper = $("<div>").css({
                                    "display": "inline-block",
                                    "vertical-align": "middle",
                                }).append(gmailBtnInnerWrapper),
                                gmailBtn = $("<button>", {
                                    "class": "yes-default-btn yes-contact-import-btn"
                                }).append(gmailBtnOuterWrapper),
                                contactImportSection = $("<div>", {
                                    "class": "yes-contact-import-section"
                                }).append(gmailBtn);

                            manualInputForm.append(manualInputField, manualInputSubmit);
                            containerBody.append(contactImportSection, manualInputForm);
                            contactsModal.init(options);

                            gmailBtn.on("click", function(evt) {
                                // Attempt to auth gmail & pull contacts
                                evt.preventDefault();
                                gmail.authPopup(options).done(function() {
                                    contactsModal.openModal();
                                    contactsModal.loading();
                                    gmail.getContacts(options)
                                        .done(
                                            function(contacts) {
                                                rankContacts(contacts).done(function(contacts) {
                                                    if (!contactsModal.isOpen) contactsModal.openModal();
                                                    contactsModal.loadContacts(contacts);
                                                }).fail(function(contacts) {
                                                    contactsModal.loadContacts(contacts, true);
                                                });
                                            }
                                    )
                                }).fail(function(data) {
                                    // Handle case where auth failed
                                    contactsModal.closeModal();
                                    contactsModal.stopLoading();
                                    flash.error(data.error);
                                    YesGraphAPI.error(data.error, false);
                                });
                            });

                            manualInputSubmit.on("click", function(evt) {
                                evt.preventDefault();
                                if (validateSettings(options.settings || {})) {
                                    send();
                                    manualInputField.val("");
                                };
                            });

                            function send(evt) {
                                try {
                                    evt.preventDefault();
                                } catch (e) {};

                                var recipients = getSelectedRecipients(manualInputField);
                                sendEmailInvites(recipients);
                            }
                        }

                        function getWidgetOptions() {
                            APP_NAME = YesGraphAPI.getApp();
                            var d = $.Deferred(),
                                OPTIONS_ENDPOINT = '/apps/' + APP_NAME + '/js/get-options';

                            YesGraphAPI.hitAPI(OPTIONS_ENDPOINT, "GET").done(function(data) {
                                d.resolve(data);
                            }).fail(function(error) {
                                YesGraphAPI.error(error.error + ". Please see the YesGraph SuperWidget Dashboard.", true);
                                d.reject(data);
                            });
                            return d.promise();
                        }

                        function rankContacts(contacts) {
                            var d = $.Deferred();
                            YesGraphAPI.rankContacts(contacts)
                                .done(function(data) {
                                    d.resolve(data.data);
                                }).fail(function(data) {
                                    d.reject(contacts.entries);
                                });
                            return d.promise();
                        }

                        function buildShareButtons(target, options) {
                            if (options.shareButtons.length === 0) return false;
                            var buttonsDiv = $("<div>"),
                                service,
                                targ,
                                shareBtn,
                                shareBtnIcon,
                                shareBtnText,
                                inviteLink = YesGraphAPI.getInviteLink(),
                                services = [{
                                    "ID": "facebook",
                                    "name": "Facebook",
                                    "baseURL": "https://www.facebook.com/share.php",
                                    "params": {
                                        u: encodeURI(inviteLink),
                                        title: options.integrations.twitter.tweetMsg
                                    },
                                    "colors": ["#3B5998", "#324b81"],
                                }, {
                                    "ID": "twitter",
                                    "name": "Twitter",
                                    "baseURL": "https://twitter.com/intent/tweet",
                                    "params": {
                                        text: options.integrations.twitter.tweetMsg + ' ' + inviteLink
                                    },
                                    "colors": ["#55ACEE", "#2E99EA"],
                                }, {
                                    "ID": "linkedin",
                                    "name": "LinkedIn",
                                    "baseURL": "https://www.linkedin.com/shareArticle",
                                    "params": {
                                        "mini": true,
                                        "url": inviteLink,
                                        "title": options.appDisplayName,
                                        "summary": options.integrations.twitter.tweetMsg
                                    },
                                    "colors": ["#0077B5", "#006399"],
                                }, {
                                    "ID": "pinterest",
                                    "name": "Pinterest",
                                    "baseURL": "https://www.pinterest.com/pin/create/button",
                                    "params": {
                                        "url": inviteLink,
                                    },
                                    "colors": ["#BD081C", "#AB071A"],
                                }];

                            for (var i = 0; i < services.length; i++) {
                                service = services[i];
                                if (options.shareButtons.indexOf(service.ID) === -1) continue;

                                shareBtnIcon = $("<span>", {
                                    "class": "yes-share-btn-icon"
                                });
                                shareBtnText = $("<span>", {
                                    "text": service.name,
                                    "class": "yes-share-btn-text",
                                });

                                shareBtnIcon.css({
                                    "background-image": "url('" + protocol + "//cdn.yesgraph.com/" + service.ID + ".png')",
                                });

                                shareBtn = $("<span>", {
                                    "class": "yes-share-btn yes-share-btn-" + service.ID,
                                    "data-name": service.name,
                                    "data-url": service.baseURL + "?" + $.param(service.params),
                                    "data-color": service.colors[0],
                                    "data-hover-color": service.colors[1],
                                });

                                shareBtn.css({
                                    "background-color": service.colors[0],
                                });

                                shareBtn.hover(function() {
                                    var $this = $(this);
                                    $this.css("background-color", $this.data("hover-color"));
                                }, function() {
                                    var $this = $(this);
                                    $this.css("background-color", $this.data("color"));
                                });

                                shareBtn.append(shareBtnIcon, shareBtnText);

                                // Handle Pinterest slightly differently
                                if (service.ID === "pinterest") {
                                    var wrapper = $("<a>", {
                                        "href": service.baseURL + "?" + $.param(service.params),
                                        "data-pin-do": "buttonBookmark",
                                        "data-pin-custom": true,
                                    }).append(shareBtn);

                                    shareBtn.on("click", function() {
                                        // Do this on each click. Otherwise images added
                                        // asynchronously (e.g., by Intercom) will not
                                        // have the desired description when pinned.
                                        $("img").not("[data-pin-description]").each(function() {
                                            this.dataset["pinDescription"] = options.integrations.twitter.tweetMsg + " " + inviteLink;
                                        });
                                        wrapper[0].click();
                                    });

                                    withScript("pinUtils", "//assets.pinterest.com/js/pinit.js", function() {
                                        buttonsDiv.append(wrapper.append(shareBtn));
                                    });

                                } else {
                                    shareBtn.on("click", function(evt) {
                                        targ = $(this);
                                        open(targ.data("url"), "Share on " + targ.data("name"), 'width=550, height=550');
                                    });
                                    buttonsDiv.append(shareBtn);
                                };
                            };
                            target.append(buttonsDiv);
                        }

                        return {
                            init: function() {
                                getWidgetOptions().done(init);
                            }
                        }
                    }());

                    // Module for all of our gmail functionality
                    // (e.g., OAuth, contact importing, etc.)
                    var gmail = (function() {

                        function getContacts(options) {
                            var d = $.Deferred(),
                                contactsFeedUrl = 'https://www.google.com/m8/feeds/contacts/default/full?max-results=1000000',
                                readContactsScope = 'https://www.googleapis.com/auth/contacts.readonly';

                            var queryParams = {
                                access_token: GMAIL_ACCESS_TOKEN,
                                alt: 'json',
                                orderby: 'lastmodified'
                            }

                            $.ajax({
                                url: contactsFeedUrl,
                                data: queryParams,
                                dataType: "jsonp",
                                success: function(data) {
                                    contacts = parseContactsFeed(data.feed);
                                    d.resolve(contacts);
                                },
                                error: function(data) {
                                    d.reject(options);
                                }
                            });
                            return d.promise();
                        }

                        function parseContactsFeed(contactsFeed) {
                            var entries = [],
                                googleEntry,
                                yesgraphEntry,
                                emails;

                            for (i in contactsFeed.entry) {
                                googleEntry = contactsFeed.entry[i];
                                yesgraphEntry = {};

                                if (googleEntry.title.$t) {
                                    yesgraphEntry.name = googleEntry.title.$t;
                                };

                                if (googleEntry.gd$email) {
                                    yesgraphEntry.emails = [];
                                    for (i in googleEntry.gd$email) {
                                        yesgraphEntry.emails.push(googleEntry.gd$email[i].address);
                                    };
                                };

                                entries.push(yesgraphEntry);
                            };

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

                        function authPopup(options) {
                            // Open the Google OAuth popup & retrieve the access token from it
                            var d = $.Deferred(),
                                url = getOAuthInfo(options)[0],
                                redirect = getOAuthInfo(options)[1],
                                win = open(url, "Google Authorization", 'width=550, height=550'),
                                count = 0,
                                token,
                                pollTimer = setInterval(function() {
                                    try {
                                        if (win.document.URL.indexOf(redirect) !== -1) {
                                            // Stop waiting & resolve or reject with results
                                            var responseUrl = win.document.URL,
                                                errorMessage = getUrlParam(responseUrl, "error"),
                                                token = getUrlParam(responseUrl, "access_token");

                                            clearInterval(pollTimer);
                                            win.close();

                                            if (token) {
                                                GMAIL_ACCESS_TOKEN = token;
                                                d.resolve({
                                                    token: GMAIL_ACCESS_TOKEN,
                                                    type: getUrlParam(responseUrl, "token_type"),
                                                    expires_in: getUrlParam(responseUrl, "expires_in")
                                                });

                                            } else {
                                                if (errorMessage === "Cannot read property 'URL' of undefined") {
                                                    errorMessage = "Authorization failed."
                                                };
                                                d.reject({
                                                    "error": errorMessage
                                                });
                                            };
                                        };
                                    } catch (e) {
                                        var okErrorMessages = [
                                            "Cannot read property 'URL' of undefined",
                                            "undefined is not an object (evaluating 'win.document.URL')"
                                        ],
                                            canIgnoreError = (okErrorMessages.indexOf(e.message) !== -1 || e.code === 18);

                                        if (count >= 200 || !canIgnoreError) {
                                            var msg = e.message;
                                            if (canIgnoreError) {
                                                msg = "Gmail authorization failed."
                                            };
                                            YesGraphAPI.error(msg, false);
                                            d.reject({
                                                "error": msg
                                            });
                                            clearInterval(pollTimer);
                                        };
                                        count++;
                                    }
                                }, 100);

                            function getOAuthInfo(options) {
                                var REDIRECT;
                                if (window.location.hostname === "localhost" || options.integrations.google.usingDefaultCredentials) {
                                    REDIRECT = window.location.origin;
                                } else {
                                    REDIRECT = options.integrations.google.redirectUrl;
                                }

                                var params = {
                                    response_type: "token",
                                    client_id: options.integrations.google.clientId,
                                    state: window.location.href,
                                    redirect_uri: options.integrations.google.redirectUrl,
                                },
                                    scope = concatScopes(["https://www.google.com/m8/feeds/",
                                        "https://www.googleapis.com/auth/userinfo.email"
                                    ]),
                                    url = "https://accounts.google.com/o/oauth2/auth?" + $.param(params) + "&scope=" + scope;
                                return [url, REDIRECT];
                            }

                            function concatScopes(scopes) {
                                var escaped_scopes = [];
                                for (var i = 0; i < scopes.length; i++) {
                                    escaped_scopes.push(encodeURIComponent(scopes[i]));
                                };
                                return escaped_scopes.join("+");
                            }

                            return d.promise();
                        }

                        return {
                            authPopup: authPopup,
                            getContacts: getContacts
                        }
                    }());

                    // Helper functions

                    function waitForClientToken() {
                        var d = $.Deferred();
                        var timer = setInterval(function() {
                            if (YesGraphAPI.getApp() && YesGraphAPI.hasClientToken() && YesGraphAPI.getInviteLink()) {
                                inviteLinkInput.val(YesGraphAPI.getInviteLink());
                                YesGraphAPI.isTestMode = isTestMode;
                                clearInterval(timer);
                                d.resolve();
                            };
                        }, 100);
                        return d.promise();
                    }

                    function getSelectedRecipients(elem) {
                        var recipients = [],
                            recipient,
                            emails,
                            email;

                        if (elem.is("textarea")) {
                            emails = elem.val().split(",");
                            for (i in emails) {
                                email = emails[i].replace(/^\s+|\s+$/g, ''); // strip whitespace
                                if (email) {
                                    if (isValidEmail(email)) {
                                        recipients.push({
                                            "email": email
                                        });
                                    } else {
                                        flash.error('Invalid email "' + email + '".');
                                    };
                                }
                            };
                            return recipients;

                        } else {
                            // Take the data- attributes of checkboxes
                            checked = elem.find('input[type="checkbox"]').filter(function() {
                                return Boolean($(this).prop("checked"));
                            });

                            // Return a list of "recipient" objects
                            var recipients = [];
                            checked.map(function() {
                                var $this = $(this);
                                recipient = {
                                    "name": $this.data("name") || undefined,
                                    "email": $this.data("email") || undefined
                                };
                                recipients.push(recipient);
                            });
                            return recipients;
                        };
                    }

                    function sendEmailInvites(recipients) {
                        var d = $.Deferred();
                        if (!recipients || recipients.length < 1) {
                            var msg = "No valid recipients specified."
                            flash.error(msg);
                            d.reject({
                                "error": msg,
                            });
                        } else {
                            YesGraphAPI.hitAPI("/send-email-invites", "POST", {
                                recipients: recipients,
                                test: TESTMODE || undefined,
                                invite_link: YesGraphAPI.getInviteLink()
                            }).done(function(resp) {
                                if (!resp.emails) {
                                    d.reject(resp);
                                    flash.error(resp);
                                    YesGraphAPI.error(resp);
                                } else {
                                    if (TESTMODE) {
                                        flash.success("Testmode: emails not sent.");
                                    } else {
                                        var inviteData, invites = {
                                                "entries": []
                                            };
                                        for (var i = 0; i < resp.emails.succeeded.length; i++) {
                                            inviteData = resp.emails.succeeded[i];
                                            invites.entries.push({
                                                "invitee_name": inviteData[0] || undefined,
                                                "email": inviteData[1],
                                                "sent_at": new Date().toISOString(),
                                            });
                                        };
                                        YesGraphAPI.postInvitesSent(invites);
                                    };
                                    // Loop through emails, flashing appropriate results
                                    var msg,
                                        successCount = resp.emails.succeeded.length,
                                        failCount = resp.emails.failed.length;

                                    if (successCount > 0) {
                                        msg = "You've successfully added " + successCount;
                                        msg += successCount === 1 ? " friend!" : " friends!";
                                        flash.success(msg);
                                    };

                                    if (failCount > 0) {
                                        msg = failCount + (failCount === 1 ? " email " : " emails ") + "failed";
                                        flash.error(msg);
                                        flash.error(resp.emails.failed[0][-1]);
                                    };
                                    d.resolve();
                                };
                            }).fail(function(data) {
                                flash.error(data.error);
                                YesGraphAPI.error(data.error, false);
                                d.reject(data);
                            });
                        };
                        return d.promise();
                    }

                    function getUrlParam(url, name) {
                        name = name.replace(new RegExp("/[[]/"), "\[").replace(new RegExp("/[]]/"), "\]");
                        var regexS = "[\?&#]" + name + "=([^&#]*)";
                        var regex = new RegExp(regexS);
                        var results = regex.exec(url);
                        if (results == null)
                            return "";
                        else
                            return results[1];
                    }

                    function isValidEmail(email) {
                        var re = /[A-Z0-9._%+-]+@[A-Z0-9.-]+.[A-Z]{2,4}/igm;
                        return re.test(email);
                    }

                    function isTestMode(bool) {
                        if ([true, false].indexOf(bool) !== -1) TESTMODE = bool;
                        return TESTMODE;
                    }

                    function validateSettings(settings) {
                        var settingsAreValid, settingsMessage;
                        if (settings.hasValidEmailSettings !== undefined) {
                            settingsAreValid = settings.hasValidEmailSettings[0];
                            settingsMessage = settings.hasValidEmailSettings[1];
                        } else {
                            settingsAreValid = settings.hasEmailTemplate && settings.hasSendGridApiKey;
                        };
                        if (!settingsAreValid) {
                            flash.error(settingsMessage);
                        };
                        return settingsAreValid;
                    }

                    // Main functionality
                    waitForClientToken().then(inviteWidget.init);

                }); // withScript Clipboard.js
            }); // withScript YesGraphAPI
        }); // withScript jQuery
    }
}();
