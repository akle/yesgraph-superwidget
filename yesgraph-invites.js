;(function($) {
$(document).on("ready", function(){
    var APP_NAME,
        target = $(".yesgraph-invites"),
        TESTMODE = ["True", "true", true, "1", 1].includes(target.data("testmode")) ? true : false,
        YESGRAPH_BASE_URL = (window.location.hostname === 'localhost'
                             && window.document.title === 'YesGraph') ? 'http://localhost:5001' : 'https://api.yesgraph.com',
        // Sections of the widget UI
        container = $("<div>"),
        containerHeader = $("<div>"),
        containerBody = $("<div>"),
        shareBtnSection = $("<div>"),
        flashSection = $("<div>");

    // Module for "flashing" stateful information
    // to the user (e.g., success, error, etc.)
    var flash = (function() {
        function flashMessage(msg, border, background) {
            var flashDiv = $("<div>", {
                "class": "yes-flash-div",
                "text": msg || ""
            });
            flashDiv.css({
                "border": "1px solid " + border,
                "background-color": background,
                "font-size": "14px",
                "padding": "7px",
                "margin": "7px 0",
                "text-align": "center",
                "border-radius": "3px",
            });
            flashSection.append(flashDiv.hide());
            flashDiv.show(300);

            setTimeout(function() {
                flashDiv.hide(300, function() {
                    $(this).remove();
                });
            }, 3500);
        }

        function success(msg) {
            flashMessage(msg || "Success!", "green", "lightgreen");
        }

        function error(msg) {
            msg = "Error: " + (msg || "Something went wrong.");
            flashMessage(msg, "red", "pink");
        }

        return {
            success: success,
            error: error,
        }
    }());

    var contactsModal = (function() {
        var modal = $("<div>", {"class": "yes-modal"}),
            overlay = $("<div>"),
            loader = $("<img>", {
                src: "//cdn.yesgraph.com/loading.svg"
            }),
            modalBody = $("<div>").append(loader),
            contactContainer = $("<div>"),
            modalFooter = $("<div>"),
            modalHeader = $("<div>"),
            modalCloseBtn = $("<div>", {
                text: "X"
            }),
            modalSendBtn = $("<input>", {
                type: "submit",
                value: "Add"
            }),
            titleText = "Add Friends",
            modalTitle = $("<p>", {
                text: titleText
            }),
            searchField = $("<input>", {
                type: "text",
                placeholder: "Search"
            }),
            suggestedHeader = $("<p>", {
                text: "Suggested"
            }),
            suggestedList = $("<div>", {
                class: "table-row"
            }),
            totalHeader = $("<p>", {
                text: "All Contacts"
            }),
            totalList = $("<div>"),
            selectAll = $("<input>", {
                type: "checkbox"
            }),
            selectAllForm = $("<form>").append(selectAll, $("<label>", {
                text: "Select All"
            }));

        function init() {
            closeModal();
            stopLoading();
            modalHeader.append(modalTitle, modalCloseBtn);
            contactContainer.append(searchField, selectAllForm);
            modalBody.append(contactContainer);
            modalFooter.append(modalSendBtn);
            modal.append(modalHeader, modalBody, modalFooter);
            $("body").append(overlay, modal);
            applyStyling();

            $(window).on("resize", centerModal);
            modalCloseBtn.on("click", closeModal);
            overlay.on("click", closeModal);
            modalSendBtn.on("click", send);
            selectAll.on("click", function(evt) {
                modalBody.find("[type='checkbox']").prop("checked", $(evt.target).prop("checked"));
                updateSendBtn();
            });
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

        function addRow(target, contact, allEmails) {

            if (contact.emails && contact.emails.length !== 0) {
                var contactRow,
                    contactEmail,
                    checkbox,
                    emailCount = allEmails ? contact.emails.length : 1;

                for (var i = 0; i < emailCount; i++) {
                    contactEmail = $("<span>", {
                        text: contact.emails[i]
                    })
                    contactRow = $('<div>', {
                        class: "yes-contact-row"
                    });
                    contactRow.append($('<div>', {
                        class: "yes-contact-row-checkbox"
                    }));
                    contactRow.append($('<div>', {
                        class: "yes-contact-row-name"
                    }));
                    contactRow.append($('<div>', {
                        class: "yes-contact-row-email"
                    }));

                    checkbox = $('<input>', {
                        type: "checkbox"
                    });
                    contactRow.children().eq(0).append(checkbox).css({
                        'padding': '0 10px 0 0'
                    });


                    contactRow.children().eq(2).append(contactEmail);

                    if (contact.name) contactRow.children().eq(1).append($('<span>', {
                        text: contact.name
                    }));

                    checkbox.data("email", contact.emails[0]);
                    checkbox.data("name", contact.name || undefined);
                    checkbox.data("")
                    contactRow.on("click", toggleSelected);

                    target.append(contactRow);

                    function toggleSelected(evt) {
                        $(evt.target).find("[type='checkbox']").prop("checked", !checkbox.prop("checked"));
                        updateSendBtn();
                    }
                }
            }
        }

        function loadContacts(contacts) {

            var innerWrapper = $("<div>", {
                style: "height: 100%; position: relative; overflow: auto;"
            }).append(totalList),
                wrappedTotalList = $("<div>", {
                    style: "height: 100%; display: table-cell; width: 100%;"
                }).append(innerWrapper),
                wrappedSuggestedList = $("<div>", {
                    style: "max-height: 180px; overflow: scroll;"
                }).append(suggestedList);

            contactContainer.append(suggestedHeader,
                wrappedSuggestedList,
                totalHeader,
                wrappedTotalList);

            // Suggested Contacts
            for (var i = 0; i < 5; i++) {
                contact = contacts[i];
                addRow(suggestedList, contact, false);
            };

            // Alphabetical Contacts

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

            stopLoading();

            // Autoselect suggested contacts
            suggestedList.find("input[type='checkbox']").prop("checked", true);

            // Total list is searchable
            searchable(searchField, [totalList]);


            // Uppercase "Contains" is a case-insensitive
            // version of jQuery "contains" used for search
            $.expr[':'].Contains = function(a, i, m) {
                return jQuery(a).text().toUpperCase()
                    .indexOf(m[3].toUpperCase()) >= 0;
            };

            function searchable(searchField, dataLists) {
                searchField.on("input", function(evt) {
                    var searchString = evt.target.value;
                    for (i in dataLists) {
                        var list = dataLists[i];
                        list.find('.yes-contact-row').hide();
                        list.find('.yes-contact-row:Contains("' + searchString + '")').show();
                    };
                });
            }

            updateSendBtn();
            applyStyling();
        }

        function applyStyling() {
            overlay.css({
                "position": "fixed",
                "top": "0",
                "left": "0",
                "width": "100%",
                "height": "100%",
                "background": "#000",
                "opacity": "0.5",
                "z-index": "100000000000"
            });

            modal.css({
                "position": "absolute",
                "background": "white",
                "width": "650px",
                "border-radius": "3px",
                "z-index": "100000000000",
                "font-size": "16px"
            });

            modalHeader.css({
                "padding": "7px",
                "font-weight": "bolder",
                "text-align": "center",
                "font-size": "20px",
                "height": "40px",
                "border-bottom": "1px solid #ccc",
            });

            modalTitle.css({
                "margin": "0"
            });

            modalCloseBtn.css({
                "cursor": "pointer",
                "position": "relative",
                "float": "right",
                "top": "-28px",
                "right": "3px",
            });

            searchField.css({
                "border": "1px solid #ccc",
                "border-radius": "3px",
                "padding": "5px 35px",
                "margin": "0 0 10px 0",
                "width": "100%",
                "background": "#fff no-repeat url('https://cdnjs.cloudflare.com/ajax/libs/foundicons/3.0.0/svgs/fi-magnifying-glass.svg')",
                "background-size": "25px",
                "background-position": "5px center",
                "font-style": "italic",
                "-webkit-box-shadow": "0px 0px 28px -13px rgba(0,0,0,1)",
                "-moz-box-shadow": "0px 0px 28px -13px rgba(0,0,0,1)",
                "box-shadow": "0px 0px 28px -13px rgba(0,0,0,1)",
            });

            modalBody.css({
                "color": "black",
                "margin": "3px",
                "padding": "25px 30px 5px",
                "height": "610px",
            });

            var headerCSS = {
                "font-weight": "bolder",
                "font-size": "16px",
                "height": "30px",
                "margin": "0",
                "display": "table-row",
            }
            suggestedHeader.css(headerCSS);
            totalHeader.css(headerCSS);

            modalSendBtn.css({
                "border": "1px solid #ccc",
                "border-radius": "3px",
                "padding": "5px",
                "width": "100%",
                "background": "white",
            });

            modalFooter.css({
                "padding": "20px 30px 25px",
                "background": "white",
                "border-radius": "3px",
            });

            selectAll.css({
                "margin": "0 6px"
            });

            selectAllForm.css({
                "font-weight": "200"
            });

            contactContainer.css({
                "display": "table",
                "width": "100%",
                "height": "100%",
            });

            loader.css({
                "width": "100px",
                "height": "100%",
                "margin": "auto",
            });

            suggestedList.css({
                "display": "table-row",
            });

            totalList.css({
                "position": "absolute",
                "top": "0",
                "bottom": "0",
                "left": "0",
                "right": "0",
            });

            modalBody.find(".yes-contact-row").css({
                'padding': '6px',
                "width": "100%",
            });

            modalBody.find(".yes-contact-row:even").css({
                "background-color": "#F1F1F1",
            });

            modalBody.find(".yes-contact-row-checkbox").css({
                "display": "table-cell",
                "width": "15px",
            });

            modalBody.find(".yes-contact-row-name").css({
                "display": "table-cell",
                "font-weight": "600",
                "width": "33%",
            });

            modalBody.find(".yes-contact-row-email").css({
                "display": "table-cell",
                "font-style": "italic",
                "font-weight": "300",
                "width": "67%",
            });
        }

        function send(evt) {
            try {
                evt.preventDefault();
            } catch (e) {};
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
                .done(function(successCount, failCount) {
                    var msg = "You've successfully added " + successCount;
                    msg += successCount == 1 ? " friend!" : " friends!";
                    flash.success(msg);
                })
                .fail(function(data) {
                    flash.error(data.error);
                })
                .always(closeModal);
        }

        function openModal(evt) {
            try {
                evt.preventDefault();
            } catch (e) {};
            init();
            modal.show();
            centerModal();
            overlay.show();
        }

        function closeModal(evt) {
            try {
                evt.preventDefault();
            } catch (e) {};
            modal.hide();
            overlay.hide();
            modal.html("");
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
        };

        function loading() {
            overlay.show();
            contactContainer.hide();
            modalSendBtn.css("visibility", "hidden");
            modalTitle.text("Loading contacts...");
            loader.css("display", "block");
        }

        function stopLoading() {
            contactContainer.show();
            modalSendBtn.css("visibility", "visible");
            modalTitle.text(titleText);
            loader.css("display", "none");
        }

        return {
            init: init,
            openModal: openModal,
            closeModal: closeModal,
            loadContacts: loadContacts,
            loading: loading,
            stopLoading: stopLoading
        }
    }());

    var inviteWidget = (function() {

        function init(options) {
            target.append(container);
            container.append(containerHeader, containerBody, flashSection, shareBtnSection);
            contactsModal.init();

            // Build container header
            var headline = $("<p>");
            headline.text("Invite Your Friends");
            headline.css({
                "font-weight": "bolder",
                "font-size": "25px",
                "text-align": "center",
            });
            containerHeader.append(headline);

            // Build share button section
            buildShareButtons(shareBtnSection, options);
            shareBtnSection.css({
                "border-top": "1px solid #ccc",
                "margin-top": "20px",
                "padding-top": "10px",
                "text-align": "center",
            });

            // Build container body
            var manualInputForm = $('<form>'),
                manualInputField = $("<textarea>", {
                    placeholder: "email1@example.com, email2@example.com",
                    rows: 4
                }),
                manualInputSubmit = $('<button>', {
                    "text": "Send"
                }),
                gmailBtn = $("<button>", {
                    "class": "yes-contact-import-btn",
                    text: "Add your Gmail contacts..."
                });

            manualInputForm.append(manualInputField, manualInputSubmit);
            containerBody.append(gmailBtn, manualInputForm);

            manualInputField.css({
                "width": "100%",
                "padding": "9px 5px 9px",
                "font": "bold 15px",
                "border": "0",
                "background": "#fff",
                "border-radius": "3px 3px 0 0",
                "font-style": "italic",
                "resize": "vertical",
            });

            manualInputSubmit.css({
                'border': '0',
                'cursor': 'pointer',
                'width': '100%',
                'height': '40px',
                'font': 'bold 15px/40px "lucida grande",arial,verdana,tahoma,sans-serif',
                'color': '#fff',
                "background": "repeat-x #1d89cf",
                "background-image": "linear-gradient(to bottom,#1e8cd3 0,#1a7ab9 100%)",
                'border-radius': '0 0 3px 3px',
            });

            manualInputSubmit.hover(function() {
                $(this).css({
                    "background": "repeat-x #1975b3",
                    "background-image": "linear-gradient(to bottom, #1975b3 0, #16679c 100%)",
                });
            }, function() {
                $(this).css({
                    "background": "repeat-x #1d89cf",
                    "background-image": "linear-gradient(to bottom,#1e8cd3 0,#1a7ab9 100%)",
                });
            });

            manualInputForm.css({
                "border": "1px solid #ccc",
                "border-radius": "3px 4px 4px 3px",
                "-webkit-box-shadow": "0px 0px 28px -13px rgba(0,0,0,1)",
                "-moz-box-shadow": "0px 0px 28px -13px rgba(0,0,0,1)",
                "box-shadow": "0px 0px 28px -13px rgba(0,0,0,1)",
            });

            container.find(".yes-contact-import-btn")
                .css({
                    "background": "repeat-x #1d89cf",
                    "background-image": "linear-gradient(to bottom,#1e8cd3 0,#1a7ab9 100%)",
                    "border-radius": "3px",
                    "color": "#fff",
                    "border": "none",
                    "font-size": "16px",
                    "height": "40px",
                    "width": "398px",
                    "padding": "0 15px",
                    "cursor": "pointer",
                    "display": "block",
                })
                .hover(function() {
                    $(this).css({
                    "background": "repeat-x #1975b3",
                    "background-image": "linear-gradient(to bottom, #1975b3 0, #16679c 100%)",
                    });
                }, function() {
                    $(this).css({
                        "background": "repeat-x #1d89cf",
                        "background-image": "linear-gradient(to bottom,#1e8cd3 0,#1a7ab9 100%)",
                    });
                });

            gmailBtn.on("click", function(evt) {
                // Attempt to auth gmail & pull contacts
                evt.preventDefault();
                contactsModal.loading();
                contactsModal.openModal();
                gmail.authPopup(options).done(function() {
                    gmail.getContacts(options)
                        .done(
                            function(contacts) {
                                rankContacts(contacts).done(function(contacts) {
                                    contactsModal.loadContacts(contacts);
                                });
                            }
                    );
                }).fail(function(data) {
                    // Handle case where auth failed
                    var msg = data.accessDenied ? "Access Denied." : undefined;
                    contactsModal.closeModal();
                    contactsModal.stopLoading();
                    flash.error(msg);
                });
            });

            manualInputSubmit.on("click", send);

            function send(evt) {
                try {
                    evt.preventDefault();
                } catch (e) {};
                var recipients = getSelectedRecipients(manualInputField);
                sendEmailInvites(recipients)
                    .done(function(successCount, failCount) {
                        var msg = "You've successfully added " + successCount;
                        msg += successCount == 1 ? " friend!" : " friends!";
                        flash.success(msg);
                    })
                    .fail(function(data) {
                        flash.error(data.error);
                    });
            }

            container.css({
                "color": "black",
                "position": "relative",
                "padding": "10px",
                "font-size": "16px",
                "display": "table",
                "margin": "10px auto",
            });

            gmailBtn.css({
                "display": "inline-block",
                "margin": "7px 0",
            });
        }

        function getWidgetOptions() {
            // Get custom widget options
            // we don't use YesGraphAPI.hitAPI here because
            // this is not an API endpoint, it's a dashboard one.
            APP_NAME = window.YesGraphAPI.app;
            var d = $.Deferred(),
                OPTIONS_URL = YESGRAPH_BASE_URL + '/apps/' + APP_NAME + '/js/get-options';

            $.ajax({
                url: OPTIONS_URL,
                success: function(data) {
                    data = JSON.parse(data);
                    d.resolve(data);
                }
            });
            return d.promise();
        }

        function rankContacts(contacts) {
            var d = $.Deferred();
            YesGraphAPI.rankContacts(contacts)
                .done(function(data) {
                    d.resolve(data.data);
                }).fail(function(data) {
                    d.resolve(contacts);
                });
            return d.promise();
        }

        function buildShareButtons(target, options) {
            if (options.shareButtons.length === 0) return false;
            var buttonsDiv = $("<div>"),
                service,
                shareBtn,
                shareBtnIcon,
                shareBtnText,
                services = [{
                    "ID": "facebook",
                    "name": "Facebook",
                    "baseURL": "http://www.facebook.com/share.php",
                    "params": {
                        u: options.urlToShare,
                        title: options.appDisplayName
                    },
                    "callToAction": "Share",
                    "colors": ["#3B5998", "#324b81"],
                }, {
                    "ID": "twitter",
                    "name": "Twitter",
                    "baseURL": "https://twitter.com/intent/tweet",
                    "params": {
                        text: options.integrations.twitter.tweetMsg + ' ' + options.urlToShare
                    },
                    "callToAction": "Tweet",
                    "colors": ["#55ACEE", "#2E99EA"],
                }, {
                    "ID": "linkedin",
                    "name": "LinkedIn",
                    "baseURL": "https://www.linkedin.com/shareArticle",
                    "params": {
                        "mini": true,
                        "url": options.urlToShare || window.location.href,
                    },
                    "callToAction": "Post",
                    "colors": ["#0077B5", "#006399"],
                }, {
                    "ID": "pinterest",
                    "name": "Pinterest",
                    "baseURL": "https://www.pinterest.com/pin/create/button",
                    "params": {
                        "url": options.urlToShare,
                    },
                    "callToAction": "Pin",
                    "colors": ["#BD081C", "#AB071A"],
                }];

            for (var i = 0; i < services.length; i++) {
                service = services[i];
                if (!options.shareButtons.includes(service.ID)) continue;

                shareBtn = $("<div>", {
                    "class": "yes-share-btn " + service.ID,
                    "data-name": service.name,
                    "data-url": service.baseURL + "?" + $.param(service.params),
                    "data-color": service.colors[0],
                    "data-hover-color": service.colors[1],
                });

                shareBtn.on("click", function(evt) {
                    var targ = $(evt.target);
                    open(targ.data("url"), "Share on " + targ.data("name"), 'width=550, height=550');
                });

                shareBtnIcon = $('<div>', {"class": "icon icon-" + service.ID});
                shareBtnText = $("<div>", {"text": service.callToAction});

                shareBtnIcon.css({
                    "background-image": "url('//cdn.yesgraph.com/" + service.ID + ".png')",
                    "background-repeat": "no-repeat",
                    "background-size": "contain",
                    "display": "table-cell",
                    "height": "20px",
                    "vertical-align": "middle",
                    "width": "20px",
                });

                shareBtnText.css({
                    "display": "table-cell",
                    "vertical-align": "middle",
                    "padding-left": "5px",
                    "font-size": "10px",
                    "font-family": "proxima-nova,Helvetica,Arial,sans-serif",
                    "text-transform": "uppercase",
                });

                shareBtn.css({
                    "background-color": service.colors[0],
                    "border": "0",
                    "color": "white",
                    "cursor": "pointer",
                    "display": "inline-block",
                    "margin": "5px",
                    "min-width": "85px",
                    "padding": "5px 15px 5px 5px",
                });

                shareBtn.hover(function(){
                    var $this = $(this);
                    $this.css("background-color", $this.data("hover-color"));
                }, function(){
                    var $this = $(this);
                    $this.css("background-color", $this.data("color"));
                });

                shareBtn.append(shareBtnIcon, shareBtnText);
                buttonsDiv.append(shareBtn);
            };

            var shareBtns = $(".yes-share-btn");
            shareBtns.hover(function() {
                $(this).css({
                    "border": "1px solid black"
                });
            }, function() {
                $(this).css({
                    "border": "1px solid rgba(0,0,0,0)"
                });
            });

            shareBtns.filter(".pinterest")
                .data("pin-do", "buttonBookmark")
                .data("pin-custom", true);

            var shareBtnsHeader = $("<p>", {
                text: "More Ways to Share"
            });
            shareBtnsHeader.css({
                "font-weight": "bold",
                "font-size": "20px",
                "text-align": "center",
            });

            target.append(shareBtnsHeader, buttonsDiv);
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
                pollTimer = setInterval(function() {
                    try {
                        if (win.document.URL.indexOf(redirect) !== -1) {
                            // Stop waiting & resolve or reject with results
                            var responseUrl = win.document.URL,
                                accessDenied = getUrlParam(responseUrl, "error");

                            clearInterval(pollTimer);
                            win.close();

                            if (accessDenied) {
                                d.reject({
                                    "accessDenied": true
                                });
                            } else {
                                GMAIL_ACCESS_TOKEN = getUrlParam(responseUrl, "access_token");
                                d.resolve({
                                    token: GMAIL_ACCESS_TOKEN,
                                    type: getUrlParam(responseUrl, "token_type"),
                                    expires_in: getUrlParam(responseUrl, "expires_in")
                                });

                            };
                        }
                    } catch (e) {
                        if (e.code !== 18 || count >= 1000) {
                            d.reject({
                                "error": e.message
                            });
                            clearInterval(pollTimer);
                        };
                        count++;
                    }
                }, 100);

            function getOAuthInfo(options) {
                var REDIRECT = options.redirectUrl,
                    params = {
                        response_type: "token",
                        client_id: options.integrations.google.clientId,
                        redirect_uri: REDIRECT,
                        scope: "https://www.google.com/m8/feeds/" // for reading contacts
                    }
                return ["https://accounts.google.com/o/oauth2/auth?" + $.param(params), REDIRECT];
            }

            return d.promise();
        }

        return {
            authPopup: authPopup,
            getContacts: getContacts
        }
    }());

    // Helper functions

    function waitForYesGraphLib() {
        var d = $.Deferred();
            timer = setInterval(function() {
                if (window.YesGraphAPI) {
                    clearInterval(timer);
                    window.YesGraphAPI.TESTMODE = TESTMODE;
                    d.resolve();
                }
            }, 100);
        return d.promise();
    }

    function waitForClientToken() {
        var d = $.Deferred();
            timer = setInterval(function() {
                if (window.YesGraphAPI.hasClientToken()) {
                    clearInterval(timer);
                    d.resolve();
                }
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
            d.reject({
                "error": "No valid recipients specified."
            });
        } else {
            YesGraphAPI.hitAPI("/send-email-invites", "POST", {
                recipients: recipients,
                test: String(TESTMODE),
            }).done(function(resp) {
                if (!resp.emails) {
                    d.reject(resp);
                } else {
                    if (TESTMODE) flash.success("Testmode: emails not sent.");
                    d.resolve(resp.emails.succeeded.length, resp.emails.failed.length);
                };
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

    // Main functionality
    waitForYesGraphLib()
        .then(waitForClientToken)
        .then(inviteWidget.init);
});
}(jQuery));
