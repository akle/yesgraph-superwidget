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
        expect(window.YesGraphAPI).not.toBe(null);
        expect(window.YesGraphAPI).toBeDefined();
    });

    it('Should have YesGraphAPI.Raven', function() {
        expect(window.YesGraphAPI.Raven).toBeDefined();
    });

    describe("testEndpoints", function() {

        it('Should hit test endpoint', function() {
            var result = window.YesGraphAPI.test();
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
            expect(result).not.toBe(null);
        });

        it('Should GET from /address-book endpoint', function() {
            spyOn(window.YesGraphAPI, 'hitAPI').and.callFake(function(endpoint, method, data, done, deferred) {
                expect(endpoint).toEqual("/address-book");
                expect(method).toEqual("GET");
                console.info('calling fake hitAPI');
                return {};
            });
            var result = window.YesGraphAPI.getRankedContacts({});
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
            expect(result).not.toBe(null);
        });

        it('Should hit invites accepted endpoint', function() {
            window.YesGraphAPI.postInvitesAccepted = jasmine.createSpy("invitesAcceptedSpy");
            window.YesGraphAPI.postInvitesAccepted();
            expect(window.YesGraphAPI.postInvitesAccepted).toHaveBeenCalled();
        });        
    });

    describe("testAnalyticsManager", function() {

        it('Should have YesGraphAPI.AnalyticsManager', function() {
            expect(window.YesGraphAPI.AnalyticsManager).toBeDefined();
        });

        it('Should hit analytics endpoint with events', function() {
            spyOn(window.YesGraphAPI, 'hitAPI');
            window.YesGraphAPI.AnalyticsManager.log("Test Event");
            expect(window.YesGraphAPI.hitAPI).toHaveBeenCalled();
        });

        it('Should not hit analytics endpoint without events', function() {
            spyOn(window.YesGraphAPI, 'hitAPI');
            window.YesGraphAPI.AnalyticsManager.postponed = []; // Clear any postponed events
            window.YesGraphAPI.AnalyticsManager.log(); // There should be no events to log
            expect(window.YesGraphAPI.hitAPI).not.toHaveBeenCalled();
        });
    });

    describe("testUtils", function() {

        it('Should store client token', function() {
            expect(window.YesGraphAPI.clientToken).toBeDefined();
        });

        it("Should optionally throw errors", function() {
            var errorMsg = "Test error message";
            var shouldThrow = true;
            expect(function(){
                window.YesGraphAPI.utils.error(errorMsg, shouldThrow)
            }).toThrow();

            shouldThrow = false;
            expect(function(){
                window.YesGraphAPI.utils.error(errorMsg, shouldThrow)
            }).not.toThrow();
        });

        it('Should be removed by YesGraphAPI.noConflict', function() {
            expect(window.YesGraphAPI).toBeDefined();
            var _api = window.YesGraphAPI.noConflict();
            expect(window.YesGraphAPI).not.toBeDefined();
            window.YesGraphAPI = _api;
            expect(window.YesGraphAPI).toBeDefined();
        });
    });
});

