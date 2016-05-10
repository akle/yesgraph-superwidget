setTimeout(runTests, 3000);  // Give scripts time to load before starting

function runTests(){

    QUnit.test("YesGraphAPI", function(assert) {
        assert.ok(window.YesGraphAPI, "Found YesGraphAPI");
        assert.ok(YesGraphAPI.hasClientToken(), "YesGraphAPI has Client Token");
        assert.ok(YesGraphAPI.getInviteLink(), "Found Invite Link");

        var done = assert.async();
        YesGraphAPI.test().always(function(response){
            condition = !response.error;
            assert.ok(condition, response.message);
            done();
        });
    });
}
