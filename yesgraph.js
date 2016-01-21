(function($){

    function getGoogleAuthUrl() {

        var oAuthClientID = "1087547563887-dc6k04gv92q59l404vfu43f0u8s0u43e.apps.googleusercontent.com";
        var oAuthRedirectURL = "http://localhost:5001";

        var requestParams = {
            response_type: "token",
            client_id: oAuthClientID,
            redirect_uri: oAuthRedirectURL,
            scope: "https://www.googleapis.com/auth/contacts.readonly",
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
            client_token: '',
            source: {
                type: 'gmail',
                name: contactsFeed.author.name,
                email: contactsFeed.author.email
            },
            entries: entries
        }

        return contacts;
    }

    function getRankedContacts(contacts) {
        // TODO: get ranked contacts from YesGraph
        return contacts;
    }

    $.fn.showContactsList = function (accessToken) {
        // Use the accessToken to get contacts, and then
        // display them on the target element.
        console.log('Loading contacts.');

        var contacts,
            $targetElem = $(this),
            contactsFeedUrl = 'https://www.google.com/m8/feeds/contacts/default/full',
            readContactsScope = 'https://www.googleapis.com/auth/contacts.readonly';

        var queryParams = {
            access_token: accessToken,
            alt: 'json',
            orderby: 'lastmodified'
        }

        $.ajax({
            url: contactsFeedUrl,
            data: queryParams,
            dataType: "jsonp",
            success: function (r) {
                contacts = parseGoogleContactsFeed(r.feed);
                contacts = getRankedContacts(contacts);

                // Display the ranked
                var entry,
                    $contactRow,
                    $contactsTable = $('<table>'),
                    $contactsList = $contactsTable.append($('<tbody>'));

                for (i in contacts.entries) {
                    entry = contacts.entries[i];

                    if (entry.emails) {

                        $contactRow = $('<tr>').css({
                            display: 'table-row'
                        });
                        $contactRow.append($('<td>'))
                                   .append($('<input>', {type: 'checkbox'}));
                        $contactRow.append($('<td>', {text: entry.name}));
                        $contactRow.append($('<td>', {text: entry.emails}));

                        // Style the contacts list
                        $contactRow.css({
                            display: 'table-row'
                        }).children().css({
                            display: 'table-cell',
                        })
                        $contactsTable.append($contactRow);
                    }
                }
                $targetElem.append($contactsTable);
            },
            error: function(e) {
                console.log('Error');
                console.log(e);
            }
        });
    }

    $.fn.showContactImporter = function () {
        var $importContactsDiv = $('<div>');

        // Add a button for importing Google Contacts
        var $googleContactsBtn = $importContactsDiv.append($('<a>', {
            text: "Google",
            href: getGoogleAuthUrl()
        }));

        $(this).append($importContactsDiv);
    }

    $.fn.showEmailImportForm = function () {
        var $emailInputDiv = $(this).append($('<div>')),
            $emailInputForm = $emailInputDiv.append($('<form>')),
            $emailInput = $emailInputForm.append($('<input>', {type: 'text'})),
            $addBtn = $emailInputForm.append($('<input>', {type: 'submit', value: 'Add'})),
            $nextBtn = $emailInputDiv.append($('<button>', {text: 'Next'}));
    }

    function buildInviteDialog ($dialogBtn) {

        // Create and initialize the dialog for the invite flow
        var $dialog = $('<div>');
        $dialog.dialog({
            autoOpen: false,
            modal: true,
            width: 500,
            buttons: [
                {
                    text: "Close",
                    click: function() {
                        $( this ).dialog( "close" );
                    }
                }
            ]
        });

        $dialogBtn.on('click', function(evt) {
            evt.preventDefault();
            $dialog.dialog("open");
        });

        return $dialog;
    }

    $.fn.yesgraphInvites = function() {
        var urlParams = getUrlParams(),
            $inviteDialog = buildInviteDialog($(this));

        // If we have an access token, get contacts & display them.
        // Otherwise, load the contact importer instead.

        if ('access_token' in urlParams) {
            $inviteDialog.dialog("open");
            $inviteDialog.showContactsList(urlParams.access_token);

        } else {
            $inviteDialog.showContactImporter();
            $inviteDialog.showEmailImportForm();
        }
    }

}(jQuery))

$('.yesgraph').yesgraphInvites();
