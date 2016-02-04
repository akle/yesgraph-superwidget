(function($, win){
    var VERSION = 'v0.0.1',
        APP_NAME,
        YESGRAPH_BASE_URL = 'https://api.yesgraph.com',
        CLIENT_TOKEN_ENDPOINT = '/client-token',
        CLIENT_TOKEN,
        tokenValidationUrl = "https://www.googleapis.com/oauth2/v3/tokeninfo",
        urlParams = getUrlParams(),
        gmailAccessToken = urlParams.access_token,
        gmailAccessDenied = urlParams.error,
        $inviteDialog,
        rankedContacts;

    function getGoogleAuthUrl(options) {
        var requestParams = {
            response_type: "token",
            client_id: options.integrations.google.clientId,
            // TODO: if this is to be embedded on multiple pages,
            // we need to be able to use distinct redirect URLs
            redirect_uri: options.redirectUrl,
            scope: "https://www.google.com/m8/feeds/" // for getting contacts
        }
        var oAuthURL =  "https://accounts.google.com/o/oauth2/auth?" + $.param(requestParams);
        return oAuthURL;
    }

    function getUrlParams () {
        // https://developers.google.com/identity/protocols/OAuth2UserAgent#handlingtheresponse
        var params = {},
            queryString = location.hash.substring(1),
            regex = /([^&=]+)=([^&]*)/g, m;

        while (m = regex.exec(queryString)) {
          params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
        }
        return params
    }

    function parseGoogleContactsFeed(contactsFeed) {
        var entries = [],
            googleEntry,
            yesgraphEntry,
            emails;

        // Aggregate the google contacts into a list of entries
        for (i in contactsFeed.entry) {
            googleEntry = contactsFeed.entry[i];
            yesgraphEntry = {}

            // Add the contact's name
            if (googleEntry.title.$t) {
                yesgraphEntry.name = googleEntry.title.$t;
            }

            // Add the contact's email addresses
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
        }
        return contacts;
    }

    function renderContacts(rankedContacts, $dialog) {
        var entry,
            $contactRow,
            $contactsList = $('<div>'),
            $searchField = $('<input>', {placeholder: "Search"}).css({border: "1px solid #ccc", "border-radius": "3px", "padding": "0.5em"}),
            $sendBtn = $('<button>', {text: "Send"});

        // Load each contact entry onto the list
        window.contacts = rankedContacts;

        for (var i=0; i < rankedContacts.length; i++) {
            entry = rankedContacts[i];
            if (entry.emails.length !== 0) {

                $contactRow = $('<div>', {
                    "class": "contactRow"
                });

                var contactRowCSS = {
                    'border-bottom': '1px solid #ccc',
                    'min-height': '50px',
                    'padding': '0.5em'
                };

                if (entry.name) {
                    $contactRow.append($('<span>', {text: entry.name}).css({'font-weight': 'bolder'}),
                                       $('<br>'),
                                       $('<span>', {text: entry.email}));
                } else {
                    $contactRow.append($('<span>', {text: entry.email}).css({'font-weight': 'bolder'}));
                }

                $contactRow.data('email', entry.emails[0]);
                $contactRow.css(contactRowCSS)

                // Handle hover & click events
                $contactRow.hover(toggleHighlight);
                $contactRow.click(toggleSelected);

                $contactsList.append($contactRow);
            }

        }

        // Setup the Send button

        $sendBtn.css({
            "border": "1px solid #CCC",
            "border-radius": "3px",
            "margin": "5px",
            "padding": "0.25em 0.5em",
            "background-color": "#F6F6F6"
        });

        $sendBtn.on('click', function () {
            // Open a mailto for the selected names
            var selectedEmails = getSelectedEmails();
            window.location.href = 'mailto:' + selectedEmails.join(',');
        });

        $dialog.append($searchField, $contactsList, $sendBtn);
        searchable($searchField, $contactsList);

        function toggleHighlight (evt) {
            var $this = $(this);
            if (!$this.hasClass('selected')) {
                if (evt.type === "mouseenter") {
                    $this.css({'background-color': '#F6F6F6'});
                } else if (evt.type === "mouseleave") {
                    $this.css({'background-color': 'white'});
                }                    
            }
        }

        function toggleSelected () {
            var $this = $(this);

            if ($this.hasClass('selected')) {
                $this.removeClass('selected');                
                $this.css({'background-color': 'white'});
            } else {
                $this.addClass('selected');                
                $this.css({'background-color': '#E6E6E6'});
            }
        }

        function getSelectedEmails () {
            return $dialog.find('.selected').map(function () {
                return $(this).data('email');
            }).get();
        }

        function searchable ($searchField, $dataList) {
            $(document).on("input", $searchField.selector, function(evt) {
                // Hide all rows, then show any rows containing
                // a value that matches the search string
                var searchString = evt.target.value;
                $dataList.find('div.contactRow').hide()
                $dataList.find('div.contactRow:contains("' + searchString + '")').show();
            });
        }
    }

    function displayRankedContacts(contacts) {
        // Use the app name to get a client_token, then use
        // the client_token to post/return contacts
        win.YesGraphAPI.rankContacts(contacts).done(function(data){
            rankedContacts = data.data;
            renderContacts(rankedContacts, $inviteDialog);
        });
        // TODO: handle failure
    }

    function fetchContacts(gmailAccessToken) {
        var d = $.Deferred(),
            contactsFeedUrl = 'https://www.google.com/m8/feeds/contacts/default/full',
            readContactsScope = 'https://www.googleapis.com/auth/contacts.readonly';

        var queryParams = {
            access_token: gmailAccessToken,
            alt: 'json',
            orderby: 'lastmodified'
        }

        $.ajax({
            url: contactsFeedUrl,
            data: queryParams,
            dataType: "jsonp",
            success: function (data) {
                contacts = parseGoogleContactsFeed(data.feed);
                d.resolve(contacts);
            },
            error: function (data) {
                // FIXME: Fail gracefully if for whatever
                // reason we can't get the gmail contacts
                d.fail(data);
            }
        });

        return d.promise();
    }

    $.fn.showContactImportPage = function (options) {
        // Show the button to import gmail contacts
        // along with a form to type in email contacts

        // TODO: Use custom styling options
        var $importContactsDiv = $('<div>');
        var $googleContactsBtn = $importContactsDiv.append($('<a>', {
            href: getGoogleAuthUrl(options)
        }).append($('<button>', {
            text: "Gmail"
        })));

        $(this).append($importContactsDiv);

        // Manual email input
        var emails,
            $emailInputDiv = $(this).append($('<div>')),
            $emailInputForm = $('<form>'),
            $inviteesDiv = $('<div>'),
            $emailInput = $('<input>', {
                type: 'text',
                placeholder: 'Email'
            }),
            $addBtn = $('<button>', {
                role: 'submit',
                text: 'Add'
            }),
            $clearBtn = $('<button>', {
                text: 'Clear'
            }),
            $sendBtn = $('<button>', {
                text: 'Send'
            });

        $emailInputForm.append($emailInput, $addBtn);
        $emailInputDiv.append($emailInputForm, $inviteesDiv, $clearBtn, $sendBtn);

        $addBtn.on("click", function(evt) {
            evt.preventDefault();

            var $invitee = $('<p>', {
                class: "invitee",
                text: $emailInput.val()
            });
            $inviteesDiv.append($invitee);
            $emailInput.val("")
        });

        $clearBtn.on("click", function(evt) {
            evt.preventDefault();
            $inviteesDiv.html("");
        });

        $sendBtn.on("click", function(evt) {
            evt.preventDefault();

            // Get the input emails & put them in a mailto
            emails = getSelectedEmails($inviteesDiv).join(',');
            window.location.href = "mailto:" + emails;
        });

        // TODO: Allow custom CSS
        var inputCSS = {
            "border": "1px solid #CCC",
            "border-radius": "3px",
            "margin": "5px",
            "padding": "0.25em 0.5em"
        };
        $emailInputDiv.find('input').css(inputCSS);

        var buttonCSS = inputCSS;
        buttonCSS["background-color"] = "#F3F3F3";
        $emailInputDiv.find('button').css(buttonCSS);

        var inviteesDivCSS = inputCSS;
        inviteesDivCSS["background-color"] = "white";
        inviteesDivCSS["min-height"] = "100px";
        $inviteesDiv.css(inviteesDivCSS);
    }

    function buildInviteDialog ($dialogBtn) {
        // Create and initialize the dialog for the invite flow
        var $dialog = $('<div>');
        $dialog.dialog({
            autoOpen: false,
            modal: true,
            width: 500,
            buttons: {
                "Close": function() {
                    $( this ).dialog( "close" );
                }
            }
        });

        $dialogBtn.on('click', function(evt) {
            evt.preventDefault();
            $dialog.dialog("open");
        });

        return $dialog;
    }

    function storeToken (data) {
        CLIENT_TOKEN = data.token
        setCookie('yg-client-token', data.token);
    }

    $.fn.yesgraphInvites = function () {
        // Wait to have YesGraphAPI loaded with a ClientToken
        $inviteDialog = buildInviteDialog($(this));
        waitForYesGraphLib().done(waitForClientToken)
                            .done(buildWidget);
    }

    function buildWidget () {
        // Get custom widget options
        // we don't use YesGraphAPI.hitAPI here because
        // this is not an API endpoint, it's a dashboard one.
        APP_NAME = win.YesGraphAPI.app;
        var getWidgetOptions = $.Deferred(),
            optionsEndpoint = '/apps/' + APP_NAME + '/js/get-options';

        $.ajax({
            url: YESGRAPH_BASE_URL + optionsEndpoint,
            success: function(data) {
                data = JSON.parse(data);
                getWidgetOptions.resolve(data);
            }
        });

        // This is the order we're going to do things in:
        getWidgetOptions.done(checkGmailAuth);
    }

    function waitForClientToken () {
        var d = $.Deferred();
        if (win.YesGraphAPI.hasClientToken()) {
            d.resolve();
        } else {
            setTimeout(function(){waitForClientToken()}, 100);
        }
        return d.promise();
    }

    function waitForYesGraphLib () {
        var d = $.Deferred();
        if (win.YesGraphAPI) {
            d.resolve();
        } else {
            setTimeout(function(){waitForYesGraphLib()}, 100);
        }
        return d.promise();
    }

    function checkGmailAuth (options) {
        // Determine what to do based on whether or not we have a valid access token.
        if (gmailAccessToken) {
            validateGmailToken(gmailAccessToken).done(
                function () {
                    fetchContacts(gmailAccessToken).done(function(contacts){
                        displayRankedContacts(contacts, $inviteDialog);
                        $inviteDialog.dialog("open");
                    });
                }
            ).fail(
                function () {
                    $inviteDialog.showContactImportPage(options);
                }
            );

        } else {
            $inviteDialog.showContactImportPage(options);
            gmailAccessDenied ? $inviteDialog.dialog("open") : null;
        };
    }

    function validateGmailToken (token) {

        var d = $.Deferred();
        $.ajax({
            url: tokenValidationUrl,
            data: {access_token: token},
            success: function () {d.resolve()},
            error: function () {d.reject()}
        });
        return d.promise();
    }

    function setCookie(key, val, expDays) {
        // Adapted from http://www.w3schools.com/js/js_cookies.asp
        var cookie = key + '=' + val;
        if (expDays) {
            var expDate = new Date();
            expDate.setTime(expDate.getTime() + (expDays*24*60*60*1000));
            cookie = cookie + '; expires=' + expDate.toGMTString();
        }
        win.document.cookie = cookie;
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

    $('.yesgraph').yesgraphInvites();
           

}(jQuery, window));
