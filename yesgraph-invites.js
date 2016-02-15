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

    function getSelectedRecipients($elem) {
        var recipient;
        return $elem.find('.selected').map(function () {
            var $this = $(this);
            recipient = {
                "name": $this.data("name") || undefined,
                "email": $this.data("email") || undefined
            };
            return recipient;
        }).get();
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
            $overlay = $('<div>'),
            $modal = $('<div>', {
                class: "yg-modal"
            }),
            $modalBody = $('<div>', {
                class: "yg-modal-body"
            }),
            $modalFooter = $('<div>', {
                class: "yg-modal-footer"
            }),
            is_open = false,
            // Buttons
            $closeBtn = $('<div>', {
                class: "yg-modal-btn yg-modal-close",
                text: "Close"
            });

        initModal();

        function initModal() {
            // EVENT HANDLERS
            $modalTrigger.on("click", toggleModal);
            $closeBtn.on("click", closeModal);
            $overlay.on("click", closeModal);
            $(window).on("resize", centerModal);
            $modalBody.on("resize", centerModal);

            // CONSTRUCT MODAL
            $modal.hide();
            $('body').append($modal);
            $('body').append($overlay);
            $modalFooter.append($closeBtn);
            $modal.append($modalBody, $modalFooter);

            // STYLING & POSTITION
            applyStyling();
            centerModal();

            // MAIN FUNCTIONALITY
            waitForYesGraphLib()
                .then(waitForClientToken)
                .then(getWidgetOptions)
                .then(renderWidget);
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

        function renderWidget(options) {
            gmail.checkAuth().done(
                function() {
                    gmail.getContacts(options)
                        .fail(renderContactImporter) // FIXME: alert google failure
                        .then(rankContacts)
                        .then(renderContactList);
                }
            ).fail(
                function() {
                    renderContactImporter(options);
                }
            );
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

        function renderContactList(options, contacts) {
            // DEFINE VARIABLES
            var contact,
                $contactRow,
                $contactList = $('<div>'),
                $searchField = $('<input>', {placeholder: "Search"}),
                $contactListPage = $('<div>'),
                $sendBtn = $('<button>', {text: "Send"});

            // STYLING
            var contactListCSS = {
                    "max-height": "500px",
                    "overflow": "scroll"
                },
                contactRowCSS = {
                    'border-bottom': '1px solid #ccc',
                    'min-height': '50px',
                    'padding': '0.5em',
                    'cursor': 'pointer'
                },
                searchFieldCSS = {
                    "border": "1px solid #CCC",
                    "border-radius": "3px",
                    "padding": "0.5em"
                };

            $contactList.css(contactListCSS);
            $searchField.css(searchFieldCSS);

            // CONSTRUCT MODAL BODY
            $contactListPage.append($searchField, $sendBtn, $contactList);
            searchable($searchField, $contactList);
            $modalBody.html($contactListPage);


            // LOAD CONTACTS
            // TODO: Include "suggested" & "alphabetical"
            for (var i=0; i < contacts.length; i++) {
                contact = contacts[i];
                if (contact.emails.length !== 0) {
                    $contactRow = $('<div>', {class: "contactRow"});

                    if (contact.name) {
                        $contactRow.append($('<span>', {
                                text: contact.name
                            }).css({
                                'font-weight': 'bolder'
                            }),
                            $('<br>'),
                            $('<span>', {
                                text: contact.email
                            }));
                    } else {
                        $contactRow.append($('<span>', {
                            text: contact.email
                        }).css({
                            'font-weight': 'bolder'
                        }));
                    };

                    $contactRow.data("email", contact.emails[0]);
                    $contactRow.data("name", contact.name || undefined);

                    $contactRow.css(contactRowCSS);
                    $contactRow.hover(toggleHighlight);
                    $contactRow.on("click", toggleSelected);

                    $contactList.append($contactRow);
                };
            }

            // EVENT HANDLERS
            $sendBtn.on("click", function(evt){
                evt.preventDefault();
                var recipients = getSelectedRecipients($contactList);
                sendEmailInvites(recipients);
            });

            function toggleHighlight(evt) {
                var $this = $(this);
                if (!$this.hasClass('selected')) {
                    if (evt.type === "mouseenter") {
                        $this.css({
                            'background-color': '#F6F6F6'
                        });
                    } else if (evt.type === "mouseleave") {
                        $this.css({
                            'background-color': 'white'
                        });
                    }
                }
            }

            function toggleSelected() {
                var $this = $(this);

                if ($this.hasClass('selected')) {
                    $this.removeClass('selected');
                    $this.css({
                        'background-color': 'white'
                    });
                } else {
                    $this.addClass('selected');
                    $this.css({
                        'background-color': '#E6E6E6'
                    });
                }
            }

            // Uppercase "Contains" is a case-insensitive
            // version of jQuery "contains" used for search
            $.expr[':'].Contains = function(a, i, m) {
              return jQuery(a).text().toUpperCase()
                  .indexOf(m[3].toUpperCase()) >= 0;
            };

            function searchable($searchField, $dataList) {
                $(document).on("input", $searchField.selector, function (evt) {
                    var searchString = evt.target.value;
                    $dataList.find('div.contactRow').hide()
                    $dataList.find('div.contactRow:Contains("' + searchString + '")').show();
                });
            }
        }

        function renderContactImporter(options){
            // DEFINE VARIABLES
            var $contactImportPage = $('<div>'),
                $authBtnsDiv = $('<div>'),
                $googleContactsBtn = $('<button>', {text: "Gmail"}),
                $inviteesDiv = $('<div>'),
                $inputField = $('<input>', {placeholder: "Email"}),
                $addBtn = $('<button>', {text: "Add"}),
                $clearBtn = $('<button>', {text: "Clear"}),
                $sendBtn = $('<button>', {text: "Send"}),
                $manualInputDiv = $('<div>');

            // STYLING
            var inviteesDivCSS = {
                "border": "1px solid #CCC",
                "border-radius": "3px",
                "margin": "5px",
                "padding": "0.25em 0.5em",
                "min-height": "100px",
                "background-color": "white"
            };

            $inviteesDiv.css(inviteesDivCSS);

            // CONSTRUCT MODAL BODY
            $manualInputDiv.append($inputField, $addBtn, $inviteesDiv, $clearBtn, $sendBtn);

            $authBtnsDiv.append($googleContactsBtn);
            $contactImportPage.append($authBtnsDiv, $manualInputDiv);
            $modalBody.html($contactImportPage);

            // EVENT HANDLERS
            $googleContactsBtn.on("click", function(){
                // If we successfully get authed, show contact list
                // Otherwise, show contact importer.
                gmail.authPopup(options).always(renderWidget);
            });

            $addBtn.on("click", function(evt) {
                evt.preventDefault();

                var $invitee = $('<p>', {
                    "class": "selected",
                    "data-email": $inputField.val(),
                    "text": $inputField.val()
                });

                $inviteesDiv.append($invitee);
                $inputField.val("");
            });

            $clearBtn.on("click", function(evt) {
                evt.preventDefault();
                $inviteesDiv.html("");
            });

            $sendBtn.on("click", function(evt) {
                evt.preventDefault();
                var recipients = getSelectedRecipients($inviteesDiv);
                sendEmailInvites(recipients);
            });
        }

        function applyStyling() {
            var borderRadius = "3px",
                modalPadding = "2px",
                modalColor = "#aaa";

            var modalCSS = {
                "position": "absolute",
                "background": modalColor,
                "border-radius": borderRadius,
                "padding": modalPadding,
                "width": "500px",
                "max-width": "90%",
                "z-index": "10001"
            };

            var modalFooterCSS = {
                "margin-top": modalPadding,
                "border-radius": borderRadius,
                "background": "#eee",
                "padding": modalPadding
            };

            var modalBodyCSS = {
                "border-radius": borderRadius,
                "background": "#fff",
                "padding": "20px"
            };

            var modalBtnCSS = {
                // Size & Position
                "padding": "5px",
                "display": "inline-block",
                // Look & Feel
                "border": "2px" + " outset " + modalColor,
                "border-radius": borderRadius,
                "background-color": "#fff",
                "cursor": "pointer"
            };

            var overlayCSS = {
                "position": "fixed",
                "top": "0px",
                "bottom": "0px",
                "left": "0px",
                "right": "0px",
                "opacity": "0.5",
                "z-index" : "10000",
                "background-color": "#000000",
                "display": "none"
            };

            $modal.css(modalCSS);
            $overlay.css(overlayCSS);
            $modalFooter.css(modalFooterCSS);
            $modalBody.css(modalBodyCSS);
            $('.yg-modal-btn').css(modalBtnCSS);
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

        function openModal() {
            $overlay.css("display", "block");
            $modal.show(100);
            is_open = true;
        }

        function closeModal() {
            $overlay.css("display", "none");
            $modal.hide(100);
            is_open = false;
        }

        function toggleModal() {
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
                    console.log("Pulled contacts!");
                    window.contacts = contacts;
                    d.resolve(contacts, options);
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
                var REDIRECT = options.redirectUrl,
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