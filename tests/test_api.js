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
    
    
    beforeEach(function () {
        jasmine.getFixtures().fixturesPath = "base/tests";  // path to your templates
        jasmine.getFixtures().load('fixtures.html.js');   // load a template
    });
    afterEach(function() {

        jasmine.getFixtures().cleanUp();
        jasmine.getFixtures().clearCache();
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

    /*
    it('Should hit API for client token', function() {
        console.info(window.YesGraphAPI.CLIENT_TOKEN);


        window.YesGraphAPI.storeToken = jasmine.createSpy("storeTokenSpy");
        window.YesGraphAPI.hitAPI = jasmine.createSpy("hitAPISpy");
        window.YesGraphAPI.getClientToken({});
        expect(window.YesGraphAPI.hitAPI).toHaveBeenCalled();
        expect(window.YesGraphAPI.storeToken).toHaveBeenCalled();
    });
    */

    it('Should store client token', function() {
        console.info(window.YesGraphAPI.CLIENT_TOKEN);
        expect(window.YesGraphAPI.CLIENT_TOKEN).not.toBeDefined();

        expect(window.YesGraphAPI.hasClientToken()).toBe(false);

        console.info(window.YesGraphAPI.storeToken);
        expect(window.YesGraphAPI.storeToken).toBeDefined();

        var token_data = {"inviteLink": "TEST_INVITE_LINK", "token": "CLIENT_TOKEN"};
        window.YesGraphAPI.storeToken(token_data);
        expect(window.YesGraphAPI.CLIENT_TOKEN).toBeDefined();
        
    });

    it('Should have variables set', function() {

        console.info(window.YesGraphAPI.YESGRAPH_BASE_URL);
        console.info(window.YesGraphAPI.YESGRAPH_API_URL);
        console.info(window.YesGraphAPI.CLIENT_TOKEN_ENDPOINT);
        console.info(window.YesGraphAPI.ADDRBOOK_ENDPOINT);
        console.info(window.YesGraphAPI.SUGGESTED_SEEN_ENDPOINT);
        console.info(window.YesGraphAPI.INVITES_SENT_ENDPOINT);
        console.info(window.YesGraphAPI.INVITES_ACCEPTED_ENDPOINT);
        expect(window.YesGraphAPI.YESGRAPH_BASE_URL).toBeDefined();
        
    });


});

