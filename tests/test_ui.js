describe('testUI', function() {
    //
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
        expect(window.YesGraphAPI).not.toBe(null);


    });
});
