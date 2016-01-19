(function ($) {
    var YESGRAPH_BASE_URL = 'http://localhost:5001'; // FIXME: This should change in prod
    var yesgraphDiv = $('div.yesgraph');
    var appName = yesgraphDiv.data('app');
    init();

    function init() {
        checkConfig();
        loadTwitter();
        loadPinterest();

        var appOptions = getAppOptions(appName);

        if (appOptions.error) {
            error('Invalid app ID.', true);
        } else {
            renderWidget(appOptions);
        }
    }

    function getAppOptions(appName) {
        var optionsUrl = YESGRAPH_BASE_URL + '/apps/' + appName + '/js/get-options';
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

    function renderWidget(options) {

        var yesgraphWidget = $('<div>');
        window.shareOptions = options;
        if (options.shareButtons) {
            var shareButtonsWidget = buildShareButtons(options);
            yesgraphWidget.append(shareButtonsWidget);
        };

        var inviteWidget = buildInviteWidget(options);
        yesgraphWidget.append(inviteWidget);

        yesgraphDiv.append(yesgraphWidget);
    }

    function buildInviteWidget(options) {
        // var token = getToken(appName);
        // var inviteWidget = $('<div>');
        // var getContactsBtn = inviteWidget.append('<button>', {'text': 'GET CONTACTS'});
        // getContactsBtn.on('click', function(){ getContacts(token); });
        // return inviteWidget;
    }

    function getContacts(token) {
        var getContactsUrl = YESGRAPH_BASE_URL + '/superwidget/address-book';
        var contacts = [];
        $.ajax({
            url: getContactsUrl,
            data: {token: token},
            dataType: "json",
            success: function(r) {
                console.log('Successfully retrieved contacts:');
                console.log(r);
                contacts = r;
            },
            error: function(e) {
                console.log('Failed to retrieve contacts:');
                console.log(e);
                error(e.responseJSON.error, false);
            }
        });
        return contacts;
    }

    function buildShareButtons(options) {

        var headline = $('<h3>', {text: 'Tell your friends about ' + options.appDisplayName + '!'});
        var fbIconUrl = 'https://cdn2.iconfinder.com/data/icons/capsocial-square-flat-3/500/facebook-128.png';
        var twIconUrl = 'https://cdn2.iconfinder.com/data/icons/capsocial-square-flat-3/500/twitter-128.png';
        var pnIconUrl = 'https://cdn2.iconfinder.com/data/icons/capsocial-square-flat-3/500/pinterest-128.png';

        var buttonsRow = $('<div>').css({
            'display': 'table',
            'table-layout': 'fixed'
        });

        // Build Twitter button
        if (options.shareButtons.includes('twitter')) {
            var twDialogParams = {
                text: options.integrations.twitter.tweetMsg + ' ' + options.urlToShare
            };

            var twShareButton = $('<a>', {
                'href': 'https://twitter.com/intent/tweet?' + objToCommas(twDialogParams),
                'class': 'yg-share-btn'
            }).append($('<img>', {'src': twIconUrl}));

            buttonsRow.append(twShareButton);
        }

        // Build Facebook button
        if (options.shareButtons.includes('facebook') && options.integrations.facebook.appId) {
            var fbShareButton = $('<a>', {
                'class': 'yg-share-btn'
            }).append($('<img>', {'src': fbIconUrl}));

            fbShareButton.on('click', openFacebookDialog);

            function openFacebookDialog(e) {
                e.preventDefault();
                var currentWindowUrl = window.location.href;
                if (currentWindowUrl.indexOf('localhost') !== -1) {
                    currentWindowUrl = 'https://www.yesgraph.com';
                };

                var fbDialogParams = {
                    app_id: options.integrations.facebook.appId,
                    display: 'iframe',
                    href: options.urlToShare,
                    redirect_uri: currentWindowUrl // FIXME
                };
                var windowObjectReference = window.open(
                    "https://www.facebook.com/dialog/share?" + objToCommas(fbDialogParams),
                    "Post to Facebook",
                    "status"
                );
            }

            buttonsRow.append(fbShareButton);
        }
    
        // Build Pinterest button
        if (options.shareButtons.includes('pinterest')) {
            var pnDialogParams = {
                'url': options.urlToShare
            };

            var pnShareButton = $('<a>', {
                'href': "https://www.pinterest.com/pin/create/button/" + objToCommas(pnDialogParams),
                'data-pin-do': 'buttonBookmark',
                'data-pin-custom': true,
                'class': 'yg-share-btn'
            }).append($('<img>', {'src': pnIconUrl}));

            buttonsRow.append(pnShareButton);         
        }

        // Style the share buttons & add them to the shareButtonsWidget
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

    function getToken(appName) {
        var cookieName = 'yg-client-token';
        var token = readCookie(cookieName);
        if (!token) {
            $.ajax({
                url: YESGRAPH_BASE_URL + '/generate-token',
                data: {'appName': appName},
                dataType: 'json',
                success: function(r) {
                    token = r;
                    setCookie(cookieName, token);
                },
                error: function(e) {
                    error(e.responseJSON.error, true);
                }
            });
        };
        return token;
    }

    function checkConfig() {
        if (!yesgraphDiv) {
            error('No target element specified.', true);
        }
        if (!appName) {
            error('No app specified.', true);
        }
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

    function setCookie(key, val, expDays) {
        // Adapted from http://www.w3schools.com/js/js_cookies.asp
        var cookie = key + '=' + val;
        if (expDays) {
            var expDate = new Date();
            expDate.setTime(expDate.getTime() + (expDays*24*60*60*1000));
            cookie = cookie + '; expires=' + expDate.toGMTString();
        }
        document.cookie = cookie;
    }

    function readCookie(key) {
        // Adapted from http://www.w3schools.com/js/js_cookies.asp
        var key = key + "=";
        var cookies = document.cookie.split(';');
        for(var i=0; i < cookies.length; i++) {
            var cookie = cookies[i];
            while (cookie.charAt(0)==' ') cookie = cookie.substring(1);
            if (cookie.indexOf(key) == 0) return cookie.substring(key.length,cookie.length);
        }
    }

    function eraseCookie(key) {
        setCookie(key, '', -1);  // Expiry date is yesterday; Erase immediately
    }

}(jQuery))