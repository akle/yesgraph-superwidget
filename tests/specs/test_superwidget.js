module.exports = function runTests(fixtures) {

    describe('testSuperwidgetUI', function() {
        // Define global variables accessible to the entire suite
        var widget;
        var _raven;

        beforeAll(() => {
            console.debug("Running test_superwidget.js with " + fixtures);
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
            jasmine.getFixtures().fixturesPath = "base/tests/fixtures";  // path to your templates
            jasmine.getFixtures().load(fixtures);  // load templates

            // Remove Raven so that we don't log sentry errors during this test suite.
            // It will be replaced in the `afterAll` function, to cleanup for any
            // test suites after this one.
            _raven = window.YesGraphAPI.Raven;
            window.YesGraphAPI.Raven = undefined;
        });

        afterAll(() => {
            // Replace the sentry error logger, so that it can
            // be used in later test suites
            window.YesGraphAPI.Raven = _raven;
        });

        beforeEach(done => {
            // Wait for the Superwidget to be ready
            if (window.YesGraphAPI && window.YesGraphAPI.Superwidget && window.YesGraphAPI.Superwidget.isReady) {
                finishPrep();
            } else {
                $(document).on("installed.yesgraph.superwidget", finishPrep);
            }
            function finishPrep(){
                widget = window.YesGraphAPI.Superwidget;
                window.YesGraphAPI.isTestMode(true);
                expect(YesGraphAPI.hasLoadedSuperwidget).toEqual(true);
                done();
            }
        });

        describe("testInstall", function() {
            beforeEach(function (done){
                // Wait for Clipboard.js to be ready
                if (window.Clipboard) {
                    done();
                } else {
                    var interval = setInterval(function(){
                        if (window.Clipboard) {
                            clearInterval(interval);
                            done();
                        }
                    }, 100);
                }
            });

            it('Should load Clipboard.js', function() {
                var originalClipboard = window.Clipboard;
                spyOn($, 'getScript').and.callFake(function(url){
                    var d = $.Deferred();
                    window.Clipboard = originalClipboard;
                    d.resolve();
                    return d.promise();
                });

                // Clipboard has been loaded already, so
                // check that we don't reload the script
                expect(window.Clipboard).toBeDefined();
                widget.view.loadClipboard();
                expect($.getScript).not.toHaveBeenCalled();

                // Remove Clipboard, and then check that
                // we can replace it with loadClipboard()
                window.Clipboard = undefined;
                expect(window.Clipboard).not.toBeDefined();

                widget.view.loadClipboard();
                expect($.getScript).toHaveBeenCalled();
                expect(window.Clipboard).toBeDefined();
            });

            it('configureClipboard() should fail gracefully', function() {
                // Save the existing version of Clipboard
                var originalClipboard = window.Clipboard;
                expect(originalClipboard).toBeDefined();

                // Replace it with an illegal constructor
                var someInvalidConstructor = "foo";
                window.Clipboard = someInvalidConstructor;

                // Because window.Clipboard is defined,
                // loadClipboard() won't reload the script
                widget.view.loadClipboard();

                // Because window.Clipboard is not a valid constructor,
                // configureClipboard() should fail gracefully
                expect(widget.view.configureClipboard).not.toThrow();

                // Cleanup
                window.Clipboard = originalClipboard;
            });

        });

        describe('testWidgetContainer', function(){
            it('Should load widget container', function() {
                expect(widget.container).toBeDefined();
            });

            describe('testContactImportSection', () => {
                // Skip these tests if the current options disabled contact importing
                beforeAll(() => {
                    if (contactImportingIsDisabled(YesGraphAPI)) pending();
                });

                it('Should load contact import section', function() {
                    expect(widget.container.find(".yes-contact-import-section").length).toEqual(1);
                });                
            });

            describe('testManualInputForm', () => {
                // Skip these tests if the current options disabled email sending
                beforeAll(() => {
                    if (emailSendingIsDisabled(YesGraphAPI)) pending();
                });

                it('Should load manual input form', function() {
                    expect(widget.container.find(".yes-manual-input-form").length).toEqual(1);
                }); 
            });

            describe('testInviteLink', () => {
                // Skip these tests if the current options disabled the invite link
                beforeAll(() => {
                    if (inviteLinkIsDisabled(YesGraphAPI)) pending();
                });

                it('Should load invite link section', function() {
                    console.log("Current app:", window.YesGraphAPI.app);
                    expect(widget.container.find(".yes-invite-link-section").length).toEqual(1);
                    expect(widget.container.find("#yes-invite-link").val()).toEqual("www.example.com/referrals?referral_code=1234");
                });
            });

            describe('testShareButtons', function(){
                // Skip these tests if the current options disabled share buttons
                beforeAll(() => {
                    if (shareButtonsAreDisabled(YesGraphAPI)) pending();
                });

                it('Should load share button section', function() {
                    expect(widget.container.find(".yes-share-btn-section").length).toEqual(1);
                });

                it('Facebook share button should open a popup', function() {
                    var spy = spyOn(window, "open").and.callFake(url => { return new FakePopup(url); });
                    widget.container.find(".yes-share-btn-facebook").click();
                    expect(spy).toHaveBeenCalled();
                });

                it('Twitter share button should open a popup', function() {
                    var spy = spyOn(window, "open").and.callFake(url => { return new FakePopup(url); });
                    widget.container.find(".yes-share-btn-twitter").click();
                    expect(spy).toHaveBeenCalled();
                });

                it('LinkedIn share button should open a popup', function() {
                    var spy = spyOn(window, "open").and.callFake(url => { return new FakePopup(url); });
                    widget.container.find(".yes-share-btn-linkedin").click();
                    expect(spy).toHaveBeenCalled();
                });

                it("Pinterest share button should NOT open a popup", function() {
                    // We shouldn't open a new window for Pinterest
                    var spy = spyOn(window, "open").and.callFake(url => { return new FakePopup(url); });
                    widget.container.find(".yes-share-btn-pinterest").click();
                    expect(spy).not.toHaveBeenCalled();
                });                
            })
        });

        describe("testOAuthUtils", function() {
            it("Should parse URL params", function() {
                var url = "www.example.com/referrals?referral_code=1234";
                expect(YesGraphAPI.utils.getUrlParam(url, "referral_code")).toEqual("1234");

                url = "www.example.com/referrals#referral_code=1234";
                expect(YesGraphAPI.utils.getUrlParam(url, "referral_code")).toEqual("1234");

                url = "www.example.com/referrals?referral_code=1234#user_id=5678";
                expect(YesGraphAPI.utils.getUrlParam(url, "referral_code")).toEqual("1234");
                expect(YesGraphAPI.utils.getUrlParam(url, "user_id")).toEqual("5678");

                url = "www.example.com/referrals";
                expect(YesGraphAPI.utils.getUrlParam(url, "referral_code")).toBeNull();
            });
        });

        describe("testOAuthFlow", function() {
            // Skip these tests if the current options disabled contact importing
            beforeAll(() => {
                if (contactImportingIsDisabled(YesGraphAPI)) pending();
            });

            it("Should succesfully complete the OAuth flow", function(done) {
                // When we open the popup, change the URL so we bypass the authorization process
                spyOn(window, "open").and.callFake(function() {
                    var url = window.location.href + "#code=TEST";
                    return new FakePopup(url);
                });

                var realHitAPI = YesGraphAPI.hitAPI;
                spyOn(YesGraphAPI, "hitAPI").and.callFake(function(url) {
                    var d = $.Deferred();
                    var fakeRespone = {
                        message: "Address book for TEST added.",
                        batch_id: "TEST",
                        meta: {
                            app_name: "TEST",
                            user_id: "TEST",
                            total_count: 0,
                            time: 1.5
                        },
                        data: {
                            ranked_contacts: [],
                            source: {
                                name: "Test User",
                                email: "test@user.com",
                                type: "gmail"
                            }
                        }
                    };
                    d.resolve(fakeRespone);
                    return d.promise();
                });

                // Click the contact import button, and check that the auth flow succeeds
                var contactImportBtn = widget.container.find(".yes-contact-import-btn").first();
                expect(contactImportBtn.length).toEqual(1);
                contactImportBtn.click();

                // Check that the popup was opened
                expect(window.open).toHaveBeenCalled();

                $(document).on("imported.yesgraph.contacts", function() {
                    // Among the API calls made, one should be to the /oauth endpoint
                    YesGraphAPI.hitAPI.calls.all().forEach(call => {
                        if (call.args.indexOf("/oauth") !== 1) done();
                    });
                });
            });
        });

        describe("testEmailValidation", function() {
            // Skip these tests if the current options disabled email sending
            beforeAll(() => {
                if (emailSendingIsDisabled(YesGraphAPI)) pending();
            });

            it("Should identify valid email recipients", function() {
                var inputField = widget.container.find(".yes-manual-input-field");
                inputField.val("valid@email.com");

                expect(function(){
                    var recipients = window.YesGraphAPI.utils.getSelectedRecipients(inputField);
                    return recipients[0].email;
                }()).toEqual("valid@email.com");
            });

            it("Should reject invalid email recipients", function() {
                var inputField = widget.container.find(".yes-manual-input-field");
                inputField.val("not-a-valid-email");

                expect(function(){
                    var recipients = window.YesGraphAPI.utils.getSelectedRecipients(inputField);
                    return recipients.length;
                }()).toEqual(0); // No valid recipients should be returned
            });

            it("Should handle multiple email subdomains", function() {
                var inputField = widget.container.find(".yes-manual-input-field");
                inputField.val("valid@email.co.uk");
    
                expect(function(){
                    var recipients = window.YesGraphAPI.utils.getSelectedRecipients(inputField);
                    return recipients[0].email;
                }()).toEqual("valid@email.co.uk");
            });

            it("Should identify multiple email recipients", function() {
                var inputField = widget.container.find(".yes-manual-input-field");
                var emails = ["Valid Email 1 <valid+1@email.com>", "valid+2@email.co.uk", "Valid Email 3 <valid+3@email.com>"];
                var recipients;

                inputField.val(emails.join(",")); // separated by comma
                recipients = window.YesGraphAPI.utils.getSelectedRecipients(inputField);
                expect(recipients.length).toEqual(emails.length);
                validateRecipientParsing(recipients);

                inputField.val(emails.join(";")); // separated by semicolon
                recipients = window.YesGraphAPI.utils.getSelectedRecipients(inputField);
                expect(recipients.length).toEqual(emails.length);
                validateRecipientParsing(recipients);

                inputField.val(emails.join(" ")); // separated by space
                recipients = window.YesGraphAPI.utils.getSelectedRecipients(inputField);
                expect(recipients.length).toEqual(emails.length);
                validateRecipientParsing(recipients);

                inputField.val(emails.join("\n")); // separated by newline
                recipients = window.YesGraphAPI.utils.getSelectedRecipients(inputField);
                expect(recipients.length).toEqual(emails.length);
                validateRecipientParsing(recipients);

                inputField.val(emails.join("\n, ")); // combined delimiters
                recipients = window.YesGraphAPI.utils.getSelectedRecipients(inputField);
                expect(recipients.length).toEqual(emails.length);
                validateRecipientParsing(recipients);

                function validateRecipientParsing(recipients) {
                    recipients.forEach(function(recipient){
                        switch (recipient.email) {
                            case "valid+1@email.com":
                                expect(recipient.name).toEqual("Valid Email 1");
                                break;
                            case "valid+2@email.co.uk":
                                expect(recipient.name).not.toBeDefined();
                                break;
                            case "valid+3@email.com":
                                expect(recipient.name).toEqual("Valid Email 3");
                                break;
                            default:
                                console.log("Email parsing failed for:", recipient.email, recipient.name);
                                expect(emails.indexOf(recipient.email)).not.toEqual(-1);  // fail the test
                        }
                    });
                }
            });
        });

        describe('testContactsModal', function(){


            beforeAll(() => {
                if (contactsModalIsDisabled(YesGraphAPI)) {
                    widget.modal.loading();
                    expect(widget.modal.container.css("display")).toEqual("none");
                }
                if (contactImportingIsDisabled(YesGraphAPI)) {
                    pending();
                }
            });

            beforeEach(() => widget.modal.loading());
            afterEach(() => widget.modal.loading());

            it('Should load contacts modal', function() {
                expect(widget.modal).toBeDefined();
                expect(widget.modal.container).toBeDefined();
            });

            it('Should handle empty contacts list', function() {
                spyOn(YesGraphAPI, "hitAPI"); // skip the api hits
                widget.modal.loadContacts([]);
                var modalSendBtn = widget.modal.container.find(".yes-modal-submit-btn");
                var modalTitle = widget.modal.container.find(".yes-modal-title");
                expect(modalSendBtn.css("visibility")).toEqual("hidden");
                expect(modalTitle.text()).toEqual("No contacts found!");
            });

            it('Should optionally exclude suggestions', function() {
                spyOn(YesGraphAPI, "hitAPI"); // skip the api hits
                var personCount = 30;
                var emailsPerPerson = 3;
                var invalidEntryCount = 5;
                var contacts = generateContacts(personCount, emailsPerPerson, invalidEntryCount);
                var expectedRowCount = (personCount - invalidEntryCount) * emailsPerPerson;

                widget.modal.loadContacts(contacts, true); // noSuggestions = true
                var totalRows = widget.modal.container.find(".yes-contact-row");
                var suggestedRows = widget.modal.container.find(".yes-suggested-contact-list .yes-contact-row");
                expect(totalRows.length).toEqual(expectedRowCount);
                expect(suggestedRows.length).toEqual(0);
            });

            it('Should display contacts', function() {
                spyOn(YesGraphAPI, "hitAPI"); // skip the api hits
                // Generate dummy contact entries to load into the widget
                var personCount = 30;
                var emailsPerPerson = 3;
                var invalidEntryCount = 5;
                var contacts = generateContacts(personCount, emailsPerPerson, invalidEntryCount);
                var expectedRowCount = (personCount - invalidEntryCount) * emailsPerPerson;
                var expectedSuggestionCount = 5;

                widget.modal.loadContacts(contacts);
                var totalRows = widget.modal.container.find(".yes-contact-row");
                var suggestedRows = widget.modal.container.find(".yes-suggested-contact-list .yes-contact-row");
                expect(totalRows.length).toEqual(expectedRowCount);
                expect(suggestedRows.length).toEqual(expectedSuggestionCount);
            });

            it('Should allow selecting contacts', function() {
                spyOn(YesGraphAPI, "hitAPI"); // skip the api hits
                // Generate dummy contact entries to load into the widget
                var personCount = 10, emailsPerPerson = 2, invalidEntryCount = 0;
                var contacts = generateContacts(personCount, emailsPerPerson, invalidEntryCount);
                var selectAll = widget.modal.container.find("input.yes-select-all");
                var contactRows = widget.modal.container.find(".yes-total-contact-list .yes-contact-row").toArray();

                widget.modal.loadContacts(contacts);

                // Check that select-all works
                expect(selectAll.prop("checked")).toBeFalsy();

                selectAll.click();
                expect(allContactsAreSelected(contactRows)).toEqual(true);

                selectAll.click();
                expect(noContactsAreSelected(contactRows)).toEqual(true);

                // Check that selecting & deselecting single rows works
                contactRows.forEach(function(row) {
                    row = $(row);
                    var checkbox = row.find("input[type='checkbox']");
                    if (checkbox.prop("checked")) { row.click(); }
                    // Clicking the row should select/deselect the contact
                    expect(checkbox.prop("checked")).toBeFalsy();
                    row.click();
                    expect(checkbox.prop("checked")).toBeTruthy();
                    row.click();
                    expect(checkbox.prop("checked")).toBeFalsy();

                    // Clicking the row's checkbox should select/deselect the contact
                    expect(checkbox.prop("checked")).toBeFalsy();
                    checkbox.click();
                    expect(checkbox.prop("checked")).toBeTruthy();
                    checkbox.click();
                    expect(checkbox.prop("checked")).toBeFalsy();
                });
            });

            it('Should correctly handle contacts with the same name', function() {
                spyOn(YesGraphAPI, "hitAPI"); // skip the api hits
                var emails = ["jane.doe@gmail.com", "jdoe@yahoo.net",
                              "jane.doe@about.me", "jdoe@hotmail.com"];
                var contacts = [
                    {
                        name: "Jane Doe",
                        emails: emails.slice(0,2)
                    },
                    {
                        name: "Jane Doe",
                        emails: emails.slice(2)
                    }
                ];
                widget.modal.loadContacts(contacts);
                var contactRows = widget.modal.container.find(".yes-contact-row");

                // Check that the email stored in the contact row data
                // is the same as the email that is displayed
                emails.forEach(function(email) {
                    var contactRow = contactRows.filter(":contains('" + email + "')");
                    var storedEmail = contactRow.find("input[type='checkbox']").data("email");
                    expect(storedEmail).toEqual(email);
                });
            });

            it('Should log suggested seen analytics', function() {
                spyOn(YesGraphAPI, "hitAPI"); // skip the api hits
                spyOn(YesGraphAPI.AnalyticsManager, "log").and.callFake(function(evt){
                    expect(evt).toEqual("Viewed Suggested Contacts");
                });

                // Open the contacts modal w/ suggestions
                var personCount = 10, emailsPerPerson = 2, invalidEntryCount = 0;
                var contacts = generateContacts(personCount, emailsPerPerson, invalidEntryCount);
                widget.modal.loadContacts(contacts);

                // Check that analytics were logged
                expect(YesGraphAPI.AnalyticsManager.log).toHaveBeenCalled();
            });

            it('Should log invites sent analytics', function() {
                // Skip email sending & return a fake response
                var emailSpy = spyOn(YesGraphAPI, "hitAPI").and.callFake(function(){
                    var d = $.Deferred();
                    var fakeRespone = {
                        "emails": {
                            "succeeded": [[null, "test@email.com", 200, "success"]],
                            "failed": []
                        },
                        "sent": [[null, "test@email.com"]]
                    };
                    d.resolve(fakeRespone);
                    return d.promise();
                });

                var invitesSentAnalyticsEvent
                var analyticsSpy = spyOn(YesGraphAPI.AnalyticsManager, "log").and.callFake(function(evt){
                    if (evt === "Invite(s) Sent") {
                        invitesSentAnalyticsEvent = evt;
                    }
                });

                // Send invites from the manual input
                widget.container.find(".yes-manual-input-field").val("test@email.com");
                widget.container.find(".yes-manual-input-submit").click();
                expect(emailSpy).toHaveBeenCalled();
                expect(analyticsSpy).toHaveBeenCalled();
                expect(invitesSentAnalyticsEvent).toBeDefined();

                invitesSentAnalyticsEvent = undefined;

                // Select contacts in the contacts modal
                widget.modal.loadContacts([{emails: ["test@email.com"]}]);
                var checkboxes = widget.modal.container.find("[type='checkbox']").not(".yes-select-all");
                expect(checkboxes.length).toEqual(1);
                checkboxes.prop("checked", true);

                // Send invites to selected contacts
                widget.modal.container.find(".yes-modal-submit-btn").click();
                expect(emailSpy).toHaveBeenCalled();
                expect(analyticsSpy).toHaveBeenCalled();
                expect(invitesSentAnalyticsEvent).toBeDefined();
            });

        });
    });
};

function generateContacts(personCount, emailsPerPerson, invalidEntryCount) {
    var contacts = [];
    for (var i=0; i < personCount; i++) {
        var entry = {
            name: generateRandomString(),
            emails: []
        };
        // Exclude emails from the first few entries. They should then be filtered
        // out of the results and the next suggestions should be shown instead.
        if (i >= invalidEntryCount) {
            for (var j=0; j < emailsPerPerson; j++) {
                entry.emails.push("someone@email" + Math.random() + new Date());
            }
        }
        contacts.push(entry);
    }
    return contacts;
}

function generateRandomString(len){
    // Start with an empty string & a charlist.
    var string = "";
    var chars = "ABCDEFGHIJabcdefghij1234567890ﭐﭑﭒﭓﭔﭕﭖﭗﭘﭙﭚﭛﭜﭝﭞﭟﺰﺱﺲﺳﺴﺵﺶﺷﺸﺹﺺﺻﺼﺽﺾﺿ的一是不了人我在有他这這中大来來上国國壹";
    var randint;
    len = len || 20;
    // Generate a random string of the specified length
    for (var i=0; i < len; i++) {
        randint = Math.floor(Math.random() * (chars.length - 1));
        string += chars[randint];
    }
    return string;
}

function allContactsAreSelected(contactRows) {
    for (let row of contactRows) {
        let rowIsSelected = Boolean($(row).find("input[type='checkbox']").prop("checked"));
        if (!rowIsSelected) { return false; }
    }
    return true;
}

function noContactsAreSelected(contactRows) {
    for (let row of contactRows) {
        let rowIsSelected = Boolean($(row).find("input[type='checkbox']").prop("checked"));
        if (rowIsSelected) { return false; }
    }
    return true;
}

function FakePopup(url) {
    this.closed = false;
    this.close = () => this.closed = true;
    this.location = { href: url };
    this.document = { URL: url };
}

function emailSendingIsDisabled(api) {
    let enabledEmailSending = api.settings.emailSending;
    enabledEmailSending = enabledEmailSending && api.Superwidget.options.settings.hasValidEmailSettings[0];
    return !enabledEmailSending;
}

function contactImportingIsDisabled(api) {
    let enabledContactImporting = api.settings.contactImporting;
    enabledContactImporting = enabledContactImporting && api.Superwidget.options.settings.hasValidOAuthSettings[0];
    return !enabledContactImporting;
}

function inviteLinkIsDisabled(api) {
    let enabledInviteLink = api.settings.inviteLink;
    return !enabledInviteLink;
}

function shareButtonsAreDisabled(api) {
    let enabledShareBtns = api.settings.shareBtns;
    enabledShareBtns = enabledShareBtns && api.Superwidget.options.shareButtons.length > 0;
    return !enabledShareBtns;
}

function contactsModalIsDisabled(api) {
    let enabledContactsModal = api.settings.showContacts;
    return !enabledContactsModal;
}
