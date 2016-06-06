describe('testAPI', function() {

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

    jasmine.getFixtures().fixturesPath = "base/tests";  // path to your templates
    jasmine.getFixtures().load('fixtures.html.js');   // load a template

    beforeEach(function (done) {
        if (window.YesGraphAPI.isReady) {
            done();
        }
        else {
            setTimeout(function() {
                done();
            }, 5000);
        }
    });
    afterEach(function() {
        //jasmine.getFixtures().cleanUp();
        ///jasmine.getFixtures().clearCache();
    });



    it('Should have yesgraph', function() {
        console.info(window.YesGraphAPI);
        expect(window.YesGraphAPI).not.toBe(null);
        expect(window.YesGraphAPI).toBeDefined();
    });

    it('Should have YesGraphAPI.Raven', function() {
        expect(window.YesGraphAPI.Raven).toBeDefined();
    });

    it('Should hit test endpoint', function() {
        var result = window.YesGraphAPI.test();
        console.info('result' + result);
        expect(result).not.toBe(null);
    });

    it('Should POST to /address-book endpoint', function() {
        spyOn(window.YesGraphAPI, 'hitAPI').and.callFake(function(endpoint, method, data, done, deferred) {
            expect(endpoint).toEqual("/address-book");
            expect(method).toEqual("POST");
            console.info('calling fake hitAPI');
            return {};
        });
        var result = window.YesGraphAPI.rankContacts({});
        console.info('result' + result);
        expect(result).not.toBe(null);
    });

    it('Should POST to /suggested-seen endpoint', function() {
        spyOn(window.YesGraphAPI, 'hitAPI').and.callFake(function(endpoint, method, data, done, deferred) {
            expect(endpoint).toEqual("/suggested-seen");
            expect(method).toEqual("POST");
            console.info('calling fake hitAPI');
            return {};
        });
        var result = window.YesGraphAPI.postSuggestedSeen({});
        console.info('result' + result);
        expect(result).not.toBe(null);
    });

    it('Should POST to /invites-sent endpoint', function() {
        spyOn(window.YesGraphAPI, 'hitAPI').and.callFake(function(endpoint, method, data, done, deferred) {
            expect(endpoint).toEqual("/invites-sent");
            expect(method).toEqual("POST");
            console.info('calling fake hitAPI');
            return {};
        });
        var result = window.YesGraphAPI.postInvitesSent({});
        console.info('result' + result);
        expect(result).not.toBe(null);
    });

    it('Should POST to /invites-accepted endpoint', function() {
        spyOn(window.YesGraphAPI, 'hitAPI').and.callFake(function(endpoint, method, data, done, deferred) {
            expect(endpoint).toEqual("/invites-accepted");
            expect(method).toEqual("POST");
            console.info('calling fake hitAPI');
            return {};
        });
        var result = window.YesGraphAPI.postInvitesAccepted({});
        console.info('result' + result);
        expect(result).not.toBe(null);
    });

    it('Should hit invites accepted endpoint', function() {
        window.YesGraphAPI.postInvitesAccepted = jasmine.createSpy("invitesAcceptedSpy");
        window.YesGraphAPI.postInvitesAccepted();
        expect(window.YesGraphAPI.postInvitesAccepted).toHaveBeenCalled();
    });

    it('Should store client token', function() {
        expect(window.YesGraphAPI.clientToken).toBeDefined();
    });

});

