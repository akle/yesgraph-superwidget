describe('testUI', function() {

    /*
    beforeEach(function () {
        jasmine.getFixtures().fixturesPath = "base/tests";  // path to your templates
        jasmine.getFixtures().load('fixtures.html');   // load a template
    });
    afterEach(function() {

        jasmine.getFixtures().cleanUp();
        jasmine.getFixtures().clearCache();
    });
    */

   /*
   beforeEach(function () {
    var fixture = '<div id="yesgraph" class="yesgraph-invites" data-testmode=true data-app="19185f1f-a583-4c6b-bc5f-8aff04dc1020" data-foo="bar"></div>';

    document.body.insertAdjacentHTML(
      'afterbegin', 
      fixture);
   });

  // remove the html fixture from the DOM
  afterEach(function() {
    document.body.removeChild(document.getElementById('fixture'));
  });
  */
   

    it('Should have yesgraph', function() {
        expect(window.YesGraphAPI).not.toBe(null);
    });
/*

    function check_not_null(key) {
        it('should not be null: ' + key, function() {
          //console.info($j(key).prop('tagName'));
          //console.info($j(key));
            var elememtArray = $j(key).get();
            console.info(elememtArray);
            
            expect($j(key)).toHaveClass('test class');
            expect($j(key)).not.toBe(null);
        });
    }


    function check_count_equal(count, expected_count) {
        it('should have the actual count ' + count + ' be equal to the expected value ' + expected_count, function() {
            expect(count).toEqual(expected_count);
        });
    }
    

    var selectors = {
//        ".yes-widget-container": 1,
//        ".yes-contact-import-btn": 2,
//        ".yes-manual-input-field": 1,
//        ".yes-manual-input-submit": 1,
//        "#yes-invite-link": 1,
//        "#yes-invite-link-copy-btn": 1,
        ".yes-share-btn": 4,
    };

    for (var key in selectors) {
        check_not_null(key);
        var expected_count = selectors[key];
        check_count_equal($j(key).length, expected_count);
    };
*/
});
