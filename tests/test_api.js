describe('testAPI', function() {

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
    jasmine.getFixtures().fixturesPath = "base/tests";  // path to your templates
    jasmine.getFixtures().load('fixtures.html.js');   // load a template

    beforeEach(function (done) {
        if (window.YesGraphAPI && window.YesGraphAPI.isReady) {
            done();
        } else {
            $(document).on("installed.yesgraph.sdk", done);
        }
    });
    afterEach(function() {
        // jasmine.getFixtures().cleanUp();
        // jasmine.getFixtures().clearCache();
    });

    it('Should have yesgraph', function() {
        expect(window.YesGraphAPI).not.toBe(null);
        expect(window.YesGraphAPI).toBeDefined();
    });

    it('Should be removed by YesGraphAPI.noConflict', function() {
        expect(window.YesGraphAPI).toBeDefined();
        var _api = window.YesGraphAPI.noConflict();
        expect(window.YesGraphAPI).not.toBeDefined();
        window.YesGraphAPI = _api;
        expect(window.YesGraphAPI).toBeDefined();
    });

    describe("testClientKey", function() {
        beforeAll(() => {
            YesGraphAPI.clientKey = "some-client-key";
            YesGraphAPI.user.user_id = "some-user-id";
        });
        afterAll(() => {
            YesGraphAPI.clientKey = undefined;
            YesGraphAPI.user.user_id = "some-user-id";
        });

        it('Should add a `user_id` when hittings /suggested-seen with a clientKey', (done) => {
            expect(YesGraphAPI).toBeDefined();
            var spy = spyOn(YesGraphAPI, "hitAPI").and.callFake((endpoint, _, data) => {
                // Check that user_ids were added to the entries
                if (endpoint === "/suggested-seen") {
                    data.entries.forEach(entry => expect(entry.user_id).toBeDefined());
                    done();
                }
            });

            // POST some entries without user_ids
            var entries = [
                { "emails": ["test1@email.com"] },
                { "emails": ["test2@email.com"] },
                { "emails": ["test3@email.com"] },
            ];
            YesGraphAPI.postSuggestedSeen({ entries: entries })
        });

    });

    describe("testInstall", function() {
        it('Should load YesGraphAPI.Raven', function() {
            // After Raven loads automatically, remove it and
            // check that we can replace it with loadRaven()
            expect(window.YesGraphAPI.Raven).toBeDefined();
            var oldRaven = YesGraphAPI.Raven;
            YesGraphAPI.Raven = undefined
            expect(window.YesGraphAPI.Raven).not.toBeDefined();

            var getScriptSpy = spyOn($, 'getScript').and.callFake(function(url){
                var d = $.Deferred();
                YesGraphAPI.Raven = oldRaven;
                d.resolve();
                return d.promise();
            });

            // Calling loadRaven() again should re-add it
            window.YesGraphAPI.utils.loadRaven();
            expect(getScriptSpy).toHaveBeenCalled();
            expect(window.YesGraphAPI.Raven).toBeDefined();
        });

        it('Should install successfully even if Raven fails', function(done) {
            // Remove the YesGraphAPI object
            var oldAPI = YesGraphAPI.noConflict();
            expect(window.YesGraphAPI).not.toBeDefined();

            // Try to re-install
            window.YesGraphAPI = new YesGraphAPIConstructor();

            // Force clientToken request to succeed
            var hitApiSpy = spyOn(YesGraphAPI, "hitAPI").and.callFake(function() {
                var d = $.Deferred();
                d.resolve({ token: oldAPI.clientToken });
                return d.promise();
            });

            // Force loadRaven() to fail
            var getScriptSpy = spyOn($, 'getScript').and.callFake(function(){
                var d = $.Deferred();
                d.reject();
                return d.promise();
            });

            YesGraphAPI.install();
            YesGraphAPI.setOptions({ auth: { app: oldAPI.app } });
            expect(hitApiSpy).toHaveBeenCalled();
            expect(getScriptSpy).toHaveBeenCalled();

            // Check that it succesfully installed            
            var interval = setInterval(function(){
                if (YesGraphAPI.isReady) {
                    clearInterval(interval);
                    done();
                }
            }, 100);

            // Cleanup! We should replace the original YesGraphAPI object
            // because the Superwidget is associated with that instance
            window.YesGraphAPI.noConflict();
            window.YesGraphAPI = oldAPI;
        });
    });

    describe("testEndpoints", function() {
        it('Should use a clientKey if available', function(done) {
            var ajaxSpy = spyOn($, "ajax").and.callFake(function(settings) {
                expect(settings.headers.Authorization).toEqual("Bearer " + YesGraphAPI.clientKey);
                done();
            });
            YesGraphAPI.clientKey = "TEST_CLIENT_KEY";
            YesGraphAPI.test();
            expect(ajaxSpy).toHaveBeenCalled();
        });

        it('Should retry failed ajax requests', function(done) {
            var endpoint = "/test";
            var ajaxCallCount = 0;

            // Force the ajax request to fail (triggering a retry)
            var ajaxSpy = spyOn($, "ajax").and.callFake(function(settings){
                var d = $.Deferred();
                if (settings.url.indexOf(endpoint) !== -1) {
                    ajaxCallCount++;
                }
                d.reject({});
                return d.promise();
            });

            // Check that we retried 3 times
            var maxTries = 3;
            var interval = 100; // 100ms
            YesGraphAPI.hitAPI(endpoint, "GET", {}, undefined, maxTries, interval).always(function(){
                expect(ajaxCallCount).toEqual(maxTries);
                done();
            });
        });

        it("Shouldn't retry successful ajax requests", function(done) {
            var endpoint = "/test";
            var ajaxCallCount = 0;

            // Force the ajax request to succeed (preventing a retry)
            var ajaxSpy = spyOn($, "ajax").and.callFake(function(settings){
                var d = $.Deferred();
                if (settings.url.indexOf(endpoint) !== -1) {
                    ajaxCallCount++;
                }
                d.resolve({});
                return d.promise();
            });

            // Check that we didn't retry
            var maxTries = 3;
            var interval = 100; // 100ms
            YesGraphAPI.hitAPI(endpoint, "GET", {}, undefined, maxTries, interval).always(function(){
                expect(ajaxCallCount).toEqual(1);
                done();
            });

        });

        it('Should hit test endpoint', function() {
            spyOn(window.YesGraphAPI, 'hitAPI').and.callFake(function(endpoint, method, data, done, maxTries, interval) {
                expect(endpoint).toEqual("/test");
                expect(method).toEqual("GET");
                return {};
            });
            var result = window.YesGraphAPI.test();
            expect(result).not.toBe(null);
        });

        it('Should POST to /address-book endpoint', function() {
            spyOn(window.YesGraphAPI, 'hitAPI').and.callFake(function(endpoint, method, data, done, maxTries, interval) {
                expect(endpoint).toEqual("/address-book");
                expect(method).toEqual("POST");
                return {};
            });
            var result = window.YesGraphAPI.rankContacts({});
            expect(result).not.toBe(null);
        });

        it('Should GET from /address-book endpoint', function() {
            spyOn(window.YesGraphAPI, 'hitAPI').and.callFake(function(endpoint, method, data, done, maxTries, interval) {
                expect(endpoint).toEqual("/address-book");
                expect(method).toEqual("GET");
                return {};
            });
            var result = window.YesGraphAPI.getRankedContacts({});
            expect(result).not.toBe(null);
        });

        it('Should POST to /suggested-seen endpoint', function() {
            spyOn(window.YesGraphAPI, 'hitAPI').and.callFake(function(endpoint, method, data, done, maxTries, interval) {
                expect(endpoint).toEqual("/suggested-seen");
                expect(method).toEqual("POST");
                return {};
            });
            var result = window.YesGraphAPI.postSuggestedSeen({});
            expect(result).not.toBe(null);
        });

        it('Should POST to /invites-sent endpoint', function() {
            spyOn(window.YesGraphAPI, 'hitAPI').and.callFake(function(endpoint, method, data, done, maxTries, interval) {
                expect(endpoint).toEqual("/invites-sent");
                expect(method).toEqual("POST");
                return {};
            });
            var result = window.YesGraphAPI.postInvitesSent({});
            expect(result).not.toBe(null);
        });

        it('Should POST to /invites-accepted endpoint', function() {
            spyOn(window.YesGraphAPI, 'hitAPI').and.callFake(function(endpoint, method, data, done, maxTries, interval) {
                expect(endpoint).toEqual("/invites-accepted");
                expect(method).toEqual("POST");
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
        beforeEach(function (done) {
            if (YesGraphAPI.AnalyticsManager.isReady) {
                done();
            } else {
                var interval = setInterval(function(){
                    if (YesGraphAPI.AnalyticsManager.isReady) {
                        clearInterval(interval);
                        done();
                    }
                }, 100);
            }
        });

        it('Should have YesGraphAPI.AnalyticsManager', function() {
            expect(YesGraphAPI.AnalyticsManager).toBeDefined();
        });

        it('Should hit analytics endpoint with events', function() {
            spyOn(YesGraphAPI, 'hitAPI');
            YesGraphAPI.AnalyticsManager.log("Test Event");
            expect(YesGraphAPI.hitAPI).toHaveBeenCalled();
        });

        it('Should not hit analytics endpoint without events', function() {
            spyOn(YesGraphAPI, 'hitAPI');
            YesGraphAPI.AnalyticsManager.postponed = []; // Clear any postponed events
            YesGraphAPI.AnalyticsManager.log(); // There should be no events to log
            expect(YesGraphAPI.hitAPI).not.toHaveBeenCalled();
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

            // In IE the console sometimes doesn't exist. We should be able
            // to handle that without the .error() method breaking.
            var _console = window.console;
            delete window.console;

            shouldThrow = false;
            expect(function(){
                window.YesGraphAPI.utils.error(errorMsg, shouldThrow)
            }).not.toThrow();

            window.console = _console;
        });
    });
});

