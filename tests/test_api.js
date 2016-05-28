describe('testAPI', function() {

    /*
    beforeEach(function () {
        jasmine.getFixtures().fixturesPath = "base/tests";  // path to your templates
        jasmine.getFixtures().load('fixtures.html');   // load a template
        jasmine.loadScript('base/dev/yesgraph.js');
        jasmine.loadScript('base/dev/yesgraph-invites.js');
    });
    afterEach(function() {

        jasmine.getFixtures().cleanUp();
        jasmine.getFixtures().clearCache();
    });
    */

    /*
    beforeEach(function () {
        window.YesGraphAPI = window.YesGraphAPI;
    });
    */

   /*
   beforeEach(function() {
    var imagelist = window.__html__['fixtures.html'];
    document.body.appendChild(imagelist);

   });
   */
    
    

  /*
    function waitForAPIConfig() {
        if (window.YesGraphAPI.getApp() && window.YesGraphAPI.hasClientToken() && ($(window.YesGraphAPI.getSettings().target).length > 0)) {
            done();
        }
        else {
            spyOn(window.YesGraphAPI.storeToken);
        }



        //http://stackoverflow.com/questions/12080087/how-to-test-the-done-and-fail-deferred-object-by-using-jasmine
        var deferred = new jQuery.Deferred();
        spyOn($, 'ajax').andReturn(deferred);
        
        var d = $.Deferred();
        var timer = setInterval(function() {
            if (window.YesGraphAPI.getApp() && window.YesGraphAPI.hasClientToken() && ($(window.YesGraphAPI.getSettings().target).length > 0)) {

                clearInterval(timer);

                d.resolve();
            };
        }, 100);
        return d.promise();
    }
    */
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

    jasmine.getFixtures().fixturesPath = "base/tests";  // path to your templates
    jasmine.getFixtures().load('fixtures.html.js');   // load a template
   
    beforeEach(function (done) {
        if (window.YesGraphAPI.getApp() && 
            window.YesGraphAPI.hasClientToken() && 
            (window.YesGraphAPI.getSettings().target.length > 0)) {
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
    });

    
    it('Should hit test endpoint', function() {
        var result = window.YesGraphAPI.test();
        console.info('result' + result);
        expect(result).not.toBe(null);

    });


    it('Should hit invites accepted endpoint', function() {
        window.YesGraphAPI.postInvitesAccepted = jasmine.createSpy("invitesAcceptedSpy");
        window.YesGraphAPI.postInvitesAccepted();
        expect(window.YesGraphAPI.postInvitesAccepted).toHaveBeenCalled();
    });


    it('Should store client token', function() {
        expect(window.YesGraphAPI.getClientToken()).toBeDefined();
        expect(window.YesGraphAPI.hasClientToken()).toBe(true);
    });

    /*
    it('Should have settings set', function() {
        console.info(window.YesGraphAPI.settings.getApp());
        console.info(window.YesGraphAPI.settings.testmode);
        console.info(window.YesGraphAPI.settings.target);
        console.info(window.YesGraphAPI.settings.contactImporting);
        console.info(window.YesGraphAPI.settings.promoteMatchingDomain);
        console.info(window.YesGraphAPI.settings.emailSending);
        console.info(window.YesGraphAPI.settings.inviteLink);
        console.info(window.YesGraphAPI.settings.shareBtns);
        expect(window.YesGraphAPI.settings.getApp()).toBeDefined();
        expect(window.YesGraphAPI.settings.testmode).toBeDefined();
        expect(window.YesGraphAPI.settings.target).toBeDefined();
        expect(window.YesGraphAPI.settings.contactImporting).toBeDefined();
        expect(window.YesGraphAPI.settings.promoteMatchingDomain).toBeDefined();
        expect(window.YesGraphAPI.settings.emailSending).toBeDefined();
        expect(window.YesGraphAPI.settings.inviteLink).toBeDefined();
        expect(window.YesGraphAPI.settings.shareBtns).toBeDefined();
    });
    */


});

