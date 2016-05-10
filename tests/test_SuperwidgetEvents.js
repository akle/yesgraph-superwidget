setTimeout(runTests, 3000);  // Give scripts time to load before starting

function runTests(){

    QUnit.test("EVENTS: set.yesgraph.recipients", function(assert) {
        var done = assert.async(),
            exampleEmails = ["jane@example.com", "joe@example.com"],
            condition;

        // Set event handler
        $(document).on("set.yesgraph.recipients", function(evt, recipients){
            // Pass the test when we catch the event
            assert.equal(evt.type, "set", "Found matching event type: set");
            assert.equal(evt.namespace, "recipients.yesgraph", "Found matching event namespace: recipients.yesgraph");
            
            for (var i=0; i<exampleEmails.length; i++) {
                var foundEmail = recipients[i].email;
                assert.equal(foundEmail, exampleEmails[i], "Found matching recipient: " + foundEmail);
            }
            done();
        });

        // Simulate the behavior that should trigger the event
        $(".yes-manual-input-field").val(exampleEmails.join(", "));
        $(".yes-manual-input-submit").trigger("click");
    });
}
