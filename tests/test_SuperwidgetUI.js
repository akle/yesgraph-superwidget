setTimeout(runTests, 3000);  // Give scripts time to load before starting

function runTests(){

    // Test that each component of the widget container appears
    QUnit.test("UI: Widget Container", function(assert) {
        var condition = $(".yes-widget-container").length > 0;
        assert.ok(condition, "Found .yes-widget-container");

        var condition = $(".yes-widget-container").length > 0;
        assert.ok(condition, "Found .yes-widget-container");
        var selectors = {
            ".yes-widget-container": 1,
            ".yes-contact-import-btn": 2,
            ".yes-manual-input-field": 1,
            ".yes-manual-input-submit": 1,
            "#yes-invite-link": 1,
            "#yes-invite-link-copy-btn": 1,
            ".yes-share-btn": 4
        }

        for (selector in selectors) {
            var count = selectors[selector];
            assert.equal($(selector).length, count, "Found " + count + " " + selector);
        }
    });
}