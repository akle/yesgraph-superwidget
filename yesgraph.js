(function($){
    var appName,
        YESGRAPH_BASE_URL = 'http://localhost:5001';  // FIXME

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
            client_token: '',  // updated when we displayRankedContacts
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

    function displayRankedContacts(contacts, $dialog) {
        // Use the app name to get a client_token, then use
        // the client_token to post/return contacts
        var rankedContacts;

        $.ajax({
            url: YESGRAPH_BASE_URL + '/v0/client-token',
            data: {appName: appName},
            success: function (r) {
                // Use the returned token to POST the contacts
                // to YesGraph & get ranked results
                var requestData = contacts;
                requestData.client_token = r.token;
                $.ajax({
                    url: YESGRAPH_BASE_URL + '/v0/address-book',
                    method: 'POST',
                    data: JSON.stringify(requestData),
                    contentType: "application/json; charset=UTF-8",
                    success: function(r) {
                        rankedContacts = r.data;
                    },
                    error: function(r) {
                        // If YesGraph ranking errors, fail silently,
                        // just rendering the unranked contacts
                        rankedContacts = contacts.entries;
                    },
                    complete: function() {
                        renderContacts(rankedContacts, $dialog);
                    }
                });
            },
            error: function(r) {
                // If YesGraph token request errors, fail silently,
                // just rendering the unranked contacts
                rankedContacts = contacts.entries;
                renderContacts(rankedContacts, $dialog);
            }
        })

        return contacts;
    }

    $.fn.showContactsList = function (gmailAccessToken) {
        // Use the gmailAccessToken to get  Gmail contacts,
        // and then display them on the target element.
        var contacts,
            $targetElem = $(this),
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
            success: function (r) {
                contacts = parseGoogleContactsFeed(r.feed);
                displayRankedContacts(contacts, $targetElem);
            },
            error: function(e) {
                // FIXME: Fail gracefully if for whatever
                // reason we can't get the gmail contacts
                console.log("Google contacts error")
            }
        });
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

    $.fn.yesgraphInvites = function() {
        appName = $(this).data('app');

        var optionsUrl = YESGRAPH_BASE_URL + '/apps/' + appName + '/js/get-options',
            tokenValidationUrl = "https://www.googleapis.com/oauth2/v3/tokeninfo",
            urlParams = getUrlParams(),
            gmailAccessToken = urlParams.access_token,
            gmailAccessDenied = urlParams.error,
            $inviteDialog = buildInviteDialog($(this));

        $.ajax({
            dataType: "json",
            url: optionsUrl,
            success: function (appOptions) {
                // Once we have the app's custom options, we should
                // check for a gmail access token and validate it.

                if (gmailAccessToken) {
                    // If the token is valid, use it to load contacts.
                    // Otherwise, clear the token & get a new one.
                    // https://developers.google.com/identity/protocols/OAuth2UserAgent#validatetoken

                    $.ajax({
                        url: tokenValidationUrl,
                        data: {access_token: gmailAccessToken},
                        success: function (data) {
                            // Valid token. Pull & display contacts
                            $inviteDialog.showContactsList(gmailAccessToken);
                            $inviteDialog.dialog("open");
                        },
                        error: function (data) {
                            // Invalid token.
                            $inviteDialog.showContactImportPage(appOptions);
                        }
                    });

                } else if (gmailAccessDenied) {
                    // If access was already denied, immediately open
                    // the contact importer.
                    $inviteDialog.dialog("open");
                    $inviteDialog.showContactImportPage(appOptions);

                } else {
                    // We don't have gmailAccessToken OR gmailAccessDenied,
                    // so we setup the contact import page but leave the dialog
                    // closed until the user manually opens it.
                    $inviteDialog.showContactImportPage(appOptions);
                }
            },
        });
    }

    $('.yesgraph').yesgraphInvites();

}(jQuery))
