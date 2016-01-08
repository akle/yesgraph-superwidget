(function($){

    var yesgraphDiv = $('div.yesgraph');
    var appId = yesgraphDiv.data('app');
    var fbAppId = '1695708317364334';
    init();

    function init(fbAppId) {
        checkConfig();
        loadFacebook();
        loadTwitter();
        loadPinterest();
        var appOptions = getAppOptions(appId);

        if (appOptions.error) {
          error('Invalid app ID.', true);
        }

        buildYesgraphWidget(yesgraphDiv, appOptions);
    }

    function getAppOptions(appId) {
      var YESGRAPH_BASE_URL = 'http://localhost:5001';  // FIXME: This should change in prod
      var optionsUrl = YESGRAPH_BASE_URL + '/apps/' + appId + '/superwidget/get-options';
      var options;

      $.ajax({
        async: false,  // define options before proceeding
        url: optionsUrl,
        success: function(r) {
          options = r;
        }
      });

      return options;
    }

    function buildYesgraphWidget(div, appOptions) {

        var headline = $('<h3>', {text: 'Tell your friends about ' + appOptions.appName + '!'});
        var fbIconUrl = 'https://cdn2.iconfinder.com/data/icons/capsocial-square-flat-3/500/facebook-128.png';
        var twIconUrl = 'https://cdn2.iconfinder.com/data/icons/capsocial-square-flat-3/500/twitter-128.png';
        var pnIconUrl = 'https://cdn2.iconfinder.com/data/icons/capsocial-square-flat-3/500/pinterest-128.png';
        var currentWindowUrl = window.location.href;

        if (window.location.href.indexOf('localhost') !== -1) {  // Facebook sharing localhost will fail
            currentWindowUrl = 'https://www.yesgraph.com';
        };

        // Build Twitter share button
        var twDialogParams = {
          text: appOptions.tweetMsg + ' ' + currentWindowUrl
        };

        var twShareButton = $('<a>', {
          'href': 'https://twitter.com/intent/tweet?' + objToCommas(twDialogParams)
        }).append($('<img>', {
          'src': twIconUrl
        }));

        // Build Facebook share button
        var fbShareButton = $('<img>', {'src': fbIconUrl});
        fbShareButton.on('click', openFacebookDialog);

        function openFacebookDialog() {
          var fbDialogParams = {
            app_id: fbAppId,
            display: 'popup',
            href: currentWindowUrl,
            redirect_uri: 'https://www.yesgraph.com/' // + 'close-window'  // FIXME: add close-window in prod
          };

          var windowObjectReference = window.open(
            "https://www.facebook.com/dialog/share?" + objToCommas(fbDialogParams),
            "Post to Facebook",
            "status"
          );
        }

        // Build Pinterest share button
        var pnDialogParams = {
          'url': currentWindowUrl
        };

        var pnShareButton = $('<a>', {
          'href': "https://www.pinterest.com/pin/create/button/" + objToCommas(pnDialogParams),
          'data-pin-do': 'buttonBookmark',
          'data-pin-custom': true
        }).append($('<img>', {
          'src': pnIconUrl
        }));

        var shareButtonsDiv = $('<div>');
        shareButtonsDiv.append(twShareButton);
        shareButtonsDiv.append(fbShareButton);
        shareButtonsDiv.append(pnShareButton);

        var yesgraphWidget = $('<div>');
        yesgraphWidget.append(headline);
        yesgraphWidget.append(shareButtonsDiv);

        div.append(yesgraphWidget);
    }

    function checkConfig() {
        if (!yesgraphDiv) {
            error('No target element specified.', true);
        }
        if (!appId) {
            error('No app specified.', true);
        }
    }

    function loadFacebook() {
        window.fbAsyncInit = function() {
          FB.init({
            appId      : fbAppId,
            xfbml      : true,
            version    : 'v2.5'
          });
        };
    }

    function loadTwitter() {
        window.twttr = (function(d, s, id) {
          var js, fjs = d.getElementsByTagName(s)[0],
            t = window.twttr || {};
          if (d.getElementById(id)) return t;
          js = d.createElement(s);
          js.id = id;
          js.src = "https://platform.twitter.com/widgets.js";
          fjs.parentNode.insertBefore(js, fjs);
         
          t._e = [];
          t.ready = function(f) {
            t._e.push(f);
          };
         
          return t;
        }(document, "script", "twitter-wjs"));
    }

    function loadPinterest() {
      (function(d){
          var f = d.getElementsByTagName('SCRIPT')[0], p = d.createElement('SCRIPT');
          p.type = 'text/javascript';
          p.async = true;
          p.src = 'https://assets.pinterest.com/js/pinit.js';
          f.parentNode.insertBefore(p, f);
      }(document));
    }

    function error(msg, fail) {
        msg = 'YesGraph Error: ' + msg;
        if (fail) {
            throw msg;
        } else {
            console.log(msg);
        }
    }

    function objToCommas(obj) {
      return Object.keys(obj).map(
        function(k){
          return k + '=' + obj[k];
        }
      ).join("&");
    }

}(jQuery))
