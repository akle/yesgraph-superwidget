describe('testSuperwidgetUI', function() {

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

    jasmine.getFixtures().fixturesPath = "base/tests";  // path to your templates
    jasmine.getFixtures().load('fixtures.html.js');   // load a template
    var widget;

    beforeEach(function (done) {
        if (window.YesGraphAPI.Superwidget && window.YesGraphAPI.Superwidget.isReady) {
            finishPrep();
        }
        else {
            setTimeout(finishPrep, 1000);
        }
        function finishPrep(){
            widget = window.YesGraphAPI.Superwidget;
            window.YesGraphAPI.isTestMode(true);
            done();
        }
    });

    afterEach(function() {
        //jasmine.getFixtures().cleanUp();
        ///jasmine.getFixtures().clearCache();
    });

    describe('testWidgetContainer', function(){
        it('Should load widget container', function() {
            expect(widget.container).toBeDefined();
        });
        it('Should load contact import section', function() {
            expect(widget.container.find(".yes-contact-import-section").length).toEqual(1);
        });
        it('Should load manual input form', function() {
            expect(widget.container.find(".yes-manual-input-form").length).toEqual(1);
        });
        it('Should load invite link section', function() {
            expect(widget.container.find(".yes-invite-link-section").length).toEqual(1);
            expect(widget.container.find("#yes-invite-link").val()).toEqual("www.example.com?foo=bar");
        });
        it('Should load share button section', function() {
            expect(widget.container.find(".yes-share-btn-section").length).toEqual(1);
        });
    });

    describe("testEmailValidation", function() {
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
    });

    describe('testContactsModal', function(){

        it('Should load contacts modal', function() {
            expect(widget.modal).toBeDefined();
            expect(widget.modal.container).toBeDefined();
        });

        it('Should display contacts', function() {
            // Generate dummy contact entries to load into the widget
            var personCount = 30;
            var emailsPerPerson = 3;
            var expectedRowCount = personCount * emailsPerPerson;
            var contacts = [];

            for (var i=0; i < personCount; i++) {
                var entry = {
                    name: generateRandomString(),
                    emails: []
                };
                for (var j=0; j < emailsPerPerson; j++) { entry.emails.push("someone@email" + Math.random() + new Date()); }
                contacts.push(entry);
            }

            widget.modal.loadContacts(contacts);
            expect(widget.modal.container.find(".yes-contact-row").length).toEqual(expectedRowCount);
        });
    });
});


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