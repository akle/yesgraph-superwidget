(function ($) {

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
        } else {
            renderWidget(appOptions);
        }
    }

    function renderWidget(options) {

        var yesgraphWidget = $('<div>');

        if (options.include.shareButtons) {
            var shareButtonsWidget = buildShareButtons(options);
            yesgraphWidget.append(shareButtonsWidget);
        };

        if (options.include.inviteFlow) {
            var inviteWidget = buildInviteWidget(options);
            yesgraphWidget.append(inviteWidget);
        };

        yesgraphDiv.append(yesgraphWidget);

    }

    function buildInviteWidget() {
        var inviteWidget = $('<div>');
        return inviteWidget;
    }

    function getAppOptions(appId) {
        var YESGRAPH_BASE_URL = 'http://localhost:5001'; // FIXME: This should change in prod
        var optionsUrl = YESGRAPH_BASE_URL + '/apps/' + appId + '/superwidget/get-options';
        var options;

        $.ajax({
            dataType: "json",
            async: false, // get options before proceeding
            url: optionsUrl,
            success: function (r) {
                options = r;
            }
        });
        return options;
    }

    function buildShareButtons(appOptions) {

        var headline = $('<h3>', {text: 'Tell your friends about ' + appOptions.appName + '!'});
        var fbIconUrl = 'https://cdn2.iconfinder.com/data/icons/capsocial-square-flat-3/500/facebook-128.png';
        var twIconUrl = 'https://cdn2.iconfinder.com/data/icons/capsocial-square-flat-3/500/twitter-128.png';
        var pnIconUrl = 'https://cdn2.iconfinder.com/data/icons/capsocial-square-flat-3/500/pinterest-128.png';
        var currentWindowUrl = window.location.href;

        if (window.location.href.indexOf('localhost') !== -1) { // Facebook sharing of localhost will fail
            currentWindowUrl = 'https://www.yesgraph.com';
        };

        // Build Twitter button
        var twDialogParams = {
            text: appOptions.tweetMsg + ' ' + currentWindowUrl
        };

        var twShareButton = $('<a>', {
            'href': 'https://twitter.com/intent/tweet?' + objToCommas(twDialogParams),
            'class': 'yg-share-btn'
        }).append($('<img>', {'src': twIconUrl}));

        // Build Facebook button
        var fbShareButton = $('<a>', {
            'class': 'yg-share-btn'
        }).append($('<img>', {'src': fbIconUrl}));

        fbShareButton.on('click', openFacebookDialog);

        function openFacebookDialog(e) {
            e.preventDefault();
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

        // Build Pinterest button
        var pnDialogParams = {
            'url': currentWindowUrl
        };

        var pnShareButton = $('<a>', {
            'href': "https://www.pinterest.com/pin/create/button/" + objToCommas(pnDialogParams),
            'data-pin-do': 'buttonBookmark',
            'data-pin-custom': true,
            'class': 'yg-share-btn'
        }).append($('<img>', {'src': pnIconUrl}));

        // Assemble the shareButtonsWidget
        var buttonsRow = $('<div>').css({
            'display': 'table',
            'table-layout': 'fixed'
        });

        buttonsRow.append(twShareButton);
        buttonsRow.append(fbShareButton);
        buttonsRow.append(pnShareButton);
        buttonsRow.children().css({
                            'display': 'table-cell',
                            'padding': '0'
                       }).children().css({'max-width': '100%'});

        var shareButtonsWidget = $('<div>', {
            'id': 'yg-share-widget'
        }).css({'margin': '1em'});

        shareButtonsWidget.append(headline);
        shareButtonsWidget.append(buttonsRow);

        return shareButtonsWidget
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
        window.fbAsyncInit = function () {
            FB.init({
                appId: fbAppId,
                xfbml: true,
                version: 'v2.5'
            });
        };
    }

    function loadTwitter() {
        window.twttr = (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0],
                t = window.twttr || {};
            if (d.getElementById(id)) return t;
            js = d.createElement(s);
            js.id = id;
            js.src = "https://platform.twitter.com/widgets.js";
            fjs.parentNode.insertBefore(js, fjs);

            t._e = [];
            t.ready = function (f) {
                t._e.push(f);
            };

            return t;
        }(document, "script", "twitter-wjs"));
    }

    function loadPinterest() {
        (function (d) {
            var f = d.getElementsByTagName('SCRIPT')[0],
                p = d.createElement('SCRIPT');
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
            function (k) {
                return k + '=' + obj[k];
            }
        ).join("&");
    }

}(jQuery))