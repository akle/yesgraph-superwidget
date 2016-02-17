;(function ($) {
    var VERSION = 'v0.0.1',
        APP_NAME,
        OPTIONS,
        YESGRAPH_BASE_URL = 'https://api.yesgraph.com',
        CLIENT_TOKEN_ENDPOINT = '/client-token',
        CLIENT_TOKEN,
        tokenValidationUrl = "https://www.googleapis.com/oauth2/v3/tokeninfo",
        GMAIL_ACCESS_TOKEN,
        rankedContacts;

    $.fn.hoverCSS = function(css) {
        var initialCSS = {};
        for (prop in css) {
            if (css.hasOwnProperty(prop)) {
                initialCSS[prop] = $(this).css(prop);
            };
        };
        return $(this).hover(
            function(){
                $(this).css(css);
            },
            function(){
                $(this).css(initialCSS);
            }
        );
    };

    function getSelectedRecipients($elem) {
        var recipient;
        if ($elem.prop("type") == "text") {
            // Take the value of this input
            recipient = {"email": $elem.val()};
            return recipient;
        } else {
            // Take the data- attributes of checkboxes
            function isChecked() {return Boolean($(this).prop("checked"));}
            $checked = $elem.find('input[type="checkbox"]').filter(isChecked);

            // Return a list of "recipient" objects
            return $checked.map(function(){
                var $this = $(this);
                recipient = {
                    "name": $this.data("name") || undefined,
                    "email": $this.data("email") || undefined
                }
                return recipient;
            });
        };
    }

    function parseGoogleContactsFeed(contactsFeed) {
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

    function sendEmailInvites(recipients) {
        YesGraphAPI.hitAPI("/send-email-invites", "POST", {recipients: recipients});
    }

    function waitForClientToken() {
        var d = $.Deferred();
        if (window.YesGraphAPI.hasClientToken()) {
            d.resolve();
        } else {
            setTimeout(function () {
                waitForClientToken();
            }, 100);
        };
        return d.promise();
    }

    function waitForYesGraphLib() {
        var d = $.Deferred();
        if (window.YesGraphAPI) {
            d.resolve();
        } else {
            setTimeout(function () {
                waitForYesGraphLib();
            }, 100);
        };
        return d.promise();
    }

    $.fn.yesgraphInvites = function () {
        // DEFINE VARIABLES
        var $modalTrigger = $(this),
            is_open = false,
            $overlay = $('<div>'),
            $modal = $('<div>', {class: "yg-modal"}),
            $modalBody = $('<div>', {class: "yg-modal-body"}),
            $modalHeader = $('<div>', {class: "yg-modal-header"}),
            $modalTitle = $('<span>', {class: "yg-modal-title"}),
            $closeBtn = $('<div>', {class: "yg-modal-close", text: "X"}),
            $contactImportPage = $('<div>'),
            $contactListPage = $('<div>');

        initModal();

        function loadFacebook (options) {
            var fbAppId = options.integrations.facebook.appId;
            if (!fbAppId) return;
            if (options.shareButtons.indexOf("facebook") === -1) return;

            var shareBtn = $('<span>', {
                "class": "fb-share-button",
                "data-href": "https://yesgraph.com",
                "data-layout": "button_count",
                "text": "Facebook"
            });
            shareBtn.insertBefore($modalTrigger);
            (function(d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) return;
                js = d.createElement(s);
                js.id = id;
                js.src = "//connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.5&appId=" + fbAppId;
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));
        }

        function loadTwitter (options) {
            if (options.shareButtons.indexOf("twitter") === -1) return;

            var shareBtn = $('<a>', {
                "href": "https://twitter.com/share",
                "class": "twitter-share-button",
                "text": "Tweet"
            });
            shareBtn.insertBefore($modalTrigger);
            (function(d,s,id){
                var js,
                    tjs=d.getElementsByTagName(s)[0],
                    p=/^http:/.test(d.location)?'http':'https';
                if (d.getElementById(id)) return;
                js=d.createElement(s);
                js.id=id;
                js.src=p+'://platform.twitter.com/widgets.js';
                tjs.parentNode.insertBefore(js, tjs);
            }(document, 'script', 'twitter-wjs'));
        }

        function initModal() {
            // EVENT HANDLERS
            $modalTrigger.on("click", toggleModal);
            $closeBtn.on("click", closeModal);
            $overlay.on("click", closeModal);
            $(window).on("resize", centerModal);
            $modalBody.on("resize", centerModal);

            // CONSTRUCT MODAL
            $modal.hide();
            $overlay.hide();
            $('body').append($modal);
            $('body').append($overlay);
            $modalHeader.append($closeBtn, $modalTitle);
            $modal.append($modalHeader, $modalBody);

            // STYLING & POSTITION
            applyStyling();

            // MAIN FUNCTIONALITY
            waitForYesGraphLib()
                .then(waitForClientToken)
                .then(getWidgetOptions)
                .then(function(options){
                    renderWidget(options);
                    loadTwitter(options);
                    loadFacebook(options);
                });

            // HELPERS
            $modal.setTitle = function(title){
                $modalTitle.html(title);
            }
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
                success: function (data) {
                    data = JSON.parse(data);
                    OPTIONS = data;
                    d.resolve(data);
                }
            });
            return d.promise();
        }

        function rankContacts(contacts, options) {
            var d = $.Deferred(),
                rankedContacts;

            YesGraphAPI.rankContacts(contacts)
                .done(
                    function(data){
                        rankedContacts = data.data || contacts;
                    }
                ).fail(
                    function() {
                        // Fail silently
                        rankedContacts = contacts;
                    }
                ).always(
                    function(resp) {
                        console.log("Yesgraph Response:");
                        console.log(resp);
                        d.resolve(options, rankedContacts);
                    }
                );

            return d.promise();
        }

        function renderWidget (options) {
            // DEFINE VARIABLES
            var $authBtnsDiv = $('<div>'),
                $googleContactsBtn = $('<a>', {href: "#", text: "+ Import Gmail Contacts", class: "yg-import-contacts-btn"}),
                $inputField = $('<input>', {type: "text", placeholder: "Email Address"}),
                $manualInputSendBtn = $('<button>', {text: "Send", class: 'yg-modal-btn yg-send-btn'}),
                $manualInputForm = $('<div>');

            $modalBody.append($contactImportPage, $contactListPage);
            $contactListPage.hide();

            // BUILD CONTACT IMPORTER
            $modal.setTitle("Refer A Friend");
            $manualInputForm.append($inputField, $manualInputSendBtn);
            $authBtnsDiv.append($googleContactsBtn);
            $contactImportPage.append($manualInputForm, $authBtnsDiv);

            var contact,
                $contactRow,
                $suggestedContacts = $('<div>'),
                $suggestedContactsHeader = $('<p>', {text: "Suggested"}),
                $suggestedContactsDiv = $('<div>'),
                $alphabeticalContacts = $('<div>'),
                $alphabeticalContactsHeader = $('<p>', {text: "All Contacts"}),
                $alphabeticalContactsDiv = $('<div>'),
                $searchField = $('<input>', {type: "text", placeholder: "Search"}),
                $importedContactSendBtn = $('<button>', {text: "Send", class: 'yg-modal-btn yg-send-btn'});

            // BUILD CONTACT LIST
            var headerCSS = {
                "font-weight": "bolder",
                "padding": "5px auto"
            };
            $suggestedContactsHeader.css(headerCSS);
            $alphabeticalContactsHeader.css(headerCSS);
            $suggestedContactsDiv.append($suggestedContactsHeader, $suggestedContacts);
            $alphabeticalContactsDiv.append($alphabeticalContactsHeader, $alphabeticalContacts);

            $contactListPage.append($searchField, $importedContactSendBtn,
                                    $suggestedContactsDiv, $alphabeticalContactsDiv);

            // EVENT HANDLERS
            $googleContactsBtn.on("click", function(evt){
                // If we successfully get authed, show contact list
                // Otherwise, show contact importer.
                evt.preventDefault();
                gmail.authPopup(options).done(function(){
                    $contactImportPage.hide();
                    $contactListPage.show();
                    gmail.getContacts(options).done(loadContacts);
                }).fail(function(){
                    $contactImportPage.show();
                    $contactListPage.hide();
                });
            });

            $manualInputForm.find(".yg-send-btn").on("click", function(evt) {
                evt.preventDefault();
                var recipients = getSelectedRecipients($inputField);
                sendEmailInvites(recipients);
            });

            applyStyling();

            $suggestedContacts.css({
                "max-height": "140px",
                "overflow": "scroll"
            });

            $alphabeticalContacts.css({
                "max-height": "400px",
                "overflow": "scroll"
            });

            // CONSTRUCT MODAL BODY
            $modalBody.append($contactListPage);

            $suggestedContacts.addRow = function(contact) {

                if (contact.emails && contact.emails.length !== 0) {
                    $contactRow = $('<div>', {class: "yg-contact-row"});
                    $contactRow.append($('<div>', {class: "yg-contact-row-checkbox"}).css({"display": "table-cell", "width": "15px"}));
                    $contactRow.append($('<div>', {class: "yg-contact-row-name"}).css({"display": "table-cell", "width": "50%"}));
                    $contactRow.append($('<div>', {class: "yg-contact-row-emails"}).css({"display": "table-cell", "width": "50%"}));

                    var $checkbox = $('<input>', {type: "checkbox"});
                    $contactRow.children().eq(0).append($checkbox).css({'padding': '0 10px 0 0'});
                    $contactRow.children().eq(2).append($('<span>', {text: contact.emails[0]}));

                    if (contact.name) $contactRow.children().eq(1).append($('<span>', {text: contact.name}));

                    $checkbox.data("email", contact.emails[0]);
                    $checkbox.data("name", contact.name || undefined);

                    $contactRow.css({'padding': '0.5em', 'cursor': 'pointer'});
                    $contactRow.hoverCSS({"background-color": "#F6F6F6"});
                    $contactRow.on("click", toggleSelected);

                    $(this).append($contactRow);

                    function toggleSelected() {
                        $checkbox.prop("checked", !$checkbox.prop("checked"));
                    }
                }
            }
            $alphabeticalContacts.addRow = $suggestedContacts.addRow;            

            function loadContacts(options, contacts) {
                // Suggested Contacts
                for (var i=0; i < contacts.entries.length; i++) {
                    contact = contacts.entries[i];
                    $suggestedContacts.addRow(contact);
                }

                // Alphabetical Contacts
                function compareContacts(a, b) {
                    if (a.name && b.name) {
                        return a.name <= b.name ? -1 : 1;
                    } else if (!a.name && !b.name) {
                        return a.emails[0] <= b.emails[0] ? -1 : 1;
                    }
                    return Boolean(b.name) - Boolean(a.name);
                }
                var sortedContacts = contacts.entries.sort(compareContacts);

                for (var i=0; i < sortedContacts.length; i++) {
                    contact = sortedContacts[i];
                    $alphabeticalContacts.addRow(contact);
                }

                // EVENT HANDLERS
                $contactListPage.find(".yg-send-btn").on("click", function(evt){
                    evt.preventDefault();
                    var recipients = getSelectedRecipients($contactListPage);
                    sendEmailInvites(recipients);
                });

                searchable($searchField, [$suggestedContacts, $alphabeticalContacts]);
                // $contactListPage.append($searchField, $importedContactSendBtn, $suggestedContacts, $alphabeticalContacts);

                // Uppercase "Contains" is a case-insensitive
                // version of jQuery "contains" used for search
                $.expr[':'].Contains = function(a, i, m) {
                  return jQuery(a).text().toUpperCase()
                      .indexOf(m[3].toUpperCase()) >= 0;
                };

                function searchable($searchField, dataLists) {
                    $(document).on("input", $searchField.selector, function (evt) {
                        var searchString = evt.target.value;
                        for (i in dataLists) {
                            var list = dataLists[i];
                            list.find('.yg-contact-row').hide();
                            list.find('.yg-contact-row:Contains("' + searchString + '")').show();
                        };
                    });
                }
                applyStyling();
            }
        }

        function applyStyling() {
            var borderRadius = "3px",
                borderColor = "#ccc",
                itemPadding = "3px 7px";

            $modal.css({
                "position": "absolute",
                "border-radius": borderRadius,
                "background-color": "white",
                "width": "500px",
                "max-width": "90%",
                "z-index": "10001"
            });

            $overlay.css({
                "position": "fixed",
                "top": "0px",
                "bottom": "0px",
                "left": "0px",
                "right": "0px",
                "opacity": "0.5",
                "z-index" : "10000",
                "background-color": "#000000",
            });

            $modalHeader.css({
                "width": "100%",
                "border-bottom": "1px solid #ddd", 
                "border-radius": borderRadius + " " + borderRadius + " 0 0",
                "padding": "7px"
            });

            $modalTitle.css({
                "display": "block",
                "text-align": "center",
                "font-size": "1.25em",
                "font-weight": "bold",
            });

            $closeBtn.css({
                "position": "static",
                "float": "right",
                "margin-right": "10px",
                "cursor": "pointer",
                "font-weight": "bold",
            });

            $modalBody.css({
                "width": "100%",
                "border-radius": "0 0 " + borderRadius + " " + borderRadius,
                "padding": "20px"
            });

            $modal.find('.yg-modal-btn').css({
                "padding": itemPadding,
                "margin": "0.25em 0.25em 0.25em 0",
                "display": "inline-block",
                "border": "1px solid " + borderColor,
                "border-radius": borderRadius,
                "background-color": "#fff",
                "cursor": "pointer"
            });

            $modal.find("input[type='text']").css({
                "padding": itemPadding,
                "border-radius": borderRadius,
                "border": "1px solid " + borderColor,
                "margin": "0.25em 0.25em 0.25em 0",
                "min-width": "70%",
            });

            $modal.find(".yg-import-contacts-btn").css({
                "text-decoration": "none",
            }).hoverCSS({
                "text-decoration": "underline",
            });

            centerModal();
        }

        function centerModal() {
            var top, left;
            top = Math.max($(window).height() - $modal.outerHeight(), 0) / 2;
            left = Math.max($(window).width() - $modal.outerWidth(), 0) / 2;
            $modal.css({
                top: top + $(window).scrollTop(),
                left: left + $(window).scrollLeft()
            });
        }

        function openModal(evt) {
            if (evt) evt.preventDefault();
            $overlay.show();
            $modal.show(100);
            is_open = true;
        }

        function closeModal(evt) {
            if (evt) evt.preventDefault();
            $overlay.hide();
            $modal.hide(100);
            is_open = false;
        }

        function toggleModal(evt) {
            if (evt) evt.preventDefault();
            if (is_open) {
                closeModal();
            } else {
                openModal();
            };
        }
    }

    var gmail = (function() {

        function getContacts(options) {
            var d = $.Deferred(),
                contactsFeedUrl = 'https://www.google.com/m8/feeds/contacts/default/full',
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
                success: function (data) {
                    contacts = parseGoogleContactsFeed(data.feed);
                    d.resolve(options, contacts);
                },
                error: function (data) {
                    // FIXME
                    console.log("Google error!");
                    console.log(data);
                    d.reject(options);
                }
            });
            return d.promise();
        }

        function validateToken(token) {

            var d = $.Deferred();
            $.ajax({
                url: tokenValidationUrl,
                data: {
                    access_token: token
                },
                success: function () {
                    d.resolve()
                },
                error: function () {
                    d.reject()
                }
            });
            return d.promise();
        }

        function checkAuth(options) {
            var d = $.Deferred(),
                response = {};

            if (GMAIL_ACCESS_TOKEN) {
                validateToken(GMAIL_ACCESS_TOKEN).done(
                    function() {
                        response = {
                            "msg": "valid",
                            "data": GMAIL_ACCESS_TOKEN
                        }
                        d.resolve(response);
                    }
                ).fail(
                    function() {
                        GMAIL_ACCESS_TOKEN = undefined;
                        response = {
                            "msg": "invalid",
                            "data": options
                        }
                        d.reject(response);
                    }
                );

            } else {
                response = {
                    "msg": "notFound",
                    "data": options
                };
                d.reject(response);
            };
            return d.promise();
        }

        function authPopup(options) {
            // Open the Google OAuth popup & retrieve the access token from it
            var d = $.Deferred(),
                url = getOAuthInfo(options)[0],
                redirect = getOAuthInfo(options)[1],
                win = window.open(url, "Google Authorization", 'width=550, height=550'),
                pollTimer = window.setInterval(function() { 
                try {
                    if (win.document.URL.indexOf(redirect) != -1) {
                        // Stop waiting & resolve or reject with results
                        var responseUrl = win.document.URL,
                            accessDenied = getUrlParam(responseUrl, "error");

                        window.clearInterval(pollTimer);
                        if (accessDenied) {
                            d.reject({"accessDenied": true});
                        } else {
                            GMAIL_ACCESS_TOKEN = getUrlParam(responseUrl, "access_token");
                            d.resolve({
                                token: GMAIL_ACCESS_TOKEN,
                                type: getUrlParam(responseUrl, "token_type"),
                                expires_in: getUrlParam(responseUrl, "expires_in")
                            });
                        };
                        win.close();
                    }
                } catch(e) {
                    // FIXME: handle errors here
                }
            }, 100);

            function getUrlParam(url, name) {
                name = name.replace(/[[]/,"\[").replace(/[]]/,"\]");
                var regexS = "[\?&#]"+name+"=([^&#]*)";
                var regex = new RegExp( regexS );
                var results = regex.exec( url );
                if( results == null )
                    return "";
                else
                    return results[1];
            }

            function getOAuthInfo(options) {
                var REDIRECT = options.redirectUrl || "http://localhost:5001", // FIXME
                    params = {
                    response_type: "token",
                    client_id: options.integrations.google.clientId,
                    redirect_uri: REDIRECT,
                    scope: "https://www.google.com/m8/feeds/" // for getting contacts
                }
                return ["https://accounts.google.com/o/oauth2/auth?" + $.param(params), REDIRECT];
            }

            return d.promise();
        }

        return {
            checkAuth: checkAuth,
            authPopup: authPopup,
            getContacts: getContacts
        }
    }());

$('.yesgraph-invites').yesgraphInvites();

}(jQuery));