describe('getDiv', function() {

    /*
  beforeEach(function() {
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

    function sandbox(html){
      var el;
    
      beforeEach(function(){
        el = $(html);
        $(document.body).append(el);
      });
    
    
      afterEach(function(){
       el.remove();
       el = null;
      });
    };


    it('Should pass', function() {
        var fixture = '<div id="yesgraph" class="yesgraph-invites" data-testmode=true data-app="19185f1f-a583-4c6b-bc5f-8aff04dc1020" data-foo="bar"></div>';
        
        sandbox(fixture);

        // Set event handler
        $(document).on("set.yesgraph.recipients", function(evt, recipients){
            // Pass the test when we catch the event
            expect(evt.type).toEqual('set');
            expect(evt.namespace).toEqual('recipients.yesgraph');
            
            for (var i=0; i<exampleEmails.length; i++) {
                var foundEmail = recipients[i].email;
                expect(foundEmail).toEqual(exampleEmails[i]);
            }
            done();
        });

        // Simulate the behavior that should trigger the event
        $(".yes-manual-input-field").val(exampleEmails.join(", "));
        $(".yes-manual-input-submit").trigger("click");

    });
});
