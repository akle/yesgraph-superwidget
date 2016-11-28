
export default function AuthManager (service, options, api) {
    var self = this;
    this.service = service;
    this.options = options;

    this.authPopup = function () {
        var d = $.Deferred();
        var getUrlParam = api.utils.getUrlParam;
        var msg, authCode, accessToken, errorMsg, responseUrl;
        var defaultAuthErrorMessage = self.service.name + " Authorization Failed";
        var oauthInfo = self.getOAuthInfo(self.service);
        var popup = open(oauthInfo.url, "_blank", service.popupSize);
        var popupTimer = setInterval(function() {
            if (typeof popup !== "object" || popup.closed === true) {
                d.reject({ error: defaultAuthErrorMessage });
                clearInterval(popupTimer);
                return;
            }
            try {
                // If the flow has finished, resolve with the token or reject with the error
                if (api.utils.matchTargetUrl(popup.location, oauthInfo.redirect)) {
                    responseUrl = popup.document.URL;
                    errorMsg = getUrlParam(responseUrl, "error_description") || getUrlParam(responseUrl, "error");
                    authCode = getUrlParam(responseUrl, "code");
                    accessToken = getUrlParam(responseUrl, "access_token") || getUrlParam(responseUrl, "token");
                    if (errorMsg) {
                        d.reject({ error: errorMsg });
                    } else if (authCode) {
                        d.resolve({
                            auth_code: authCode,
                            token_type: "code"
                        });
                    } else if (accessToken) {
                        d.resolve({
                            access_token: accessToken,
                            token_type: "access_token"
                        });
                    } else {
                        d.reject({ error: defaultAuthErrorMessage }); // This should never happen
                    }
                    clearInterval(popupTimer);
                    if (popup) {
                        popup.close();
                    }
                }
            } catch (e) {
                // Check the error message, then either keep waiting or reject with the error
                var okErrorMessages = /(Cannot read property 'URL' of undefined|undefined is not an object \(evaluating '\w*.document.URL'\)|Permission denied to access property "\w*"|Permission denied)/, // jshint ignore:line
                    canIgnoreError = (e.code === 18 || okErrorMessages.test(e.message));
                if (!canIgnoreError) {
                    msg = canIgnoreError ? defaultAuthErrorMessage : e.message;
                    d.reject({
                        error: msg
                    });
                    api.utils.error(msg, false);
                    clearInterval(popupTimer);
                    if (popup) {
                        popup.close();
                    }
                }
            }
        }, 500);
        return d.promise();
    };

    this.getOAuthInfo = function (settings) {
        var redirect, localHostnames = ["localhost", "lvh.me"];
        if (localHostnames.indexOf(window.location.hostname) !== -1 || self.options.integrations[settings.id].usingDefaultCredentials) {
            redirect = window.location.origin;
        } else {
            redirect = self.options.integrations[settings.id].redirectUrl;
        }
        if (settings.authParams.client_id === null) {
            settings.authParams.client_id = self.options.integrations[settings.id].clientId;
        }
        if (settings.authParams.redirect_uri === null) {
            settings.authParams.redirect_uri = self.options.integrations[settings.id].redirectUrl;
        }
        var fullUrl = settings.baseAuthUrl + "?" + $.param(settings.authParams);
        return {
            url: fullUrl,
            redirect: redirect
        };
    };
}
