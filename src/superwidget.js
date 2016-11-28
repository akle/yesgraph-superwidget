/*!
 * YesGraph Superwidget dev/__SUPERWIDGET_VERSION__
 *
 * https://www.yesgraph.com
 * https://docs.yesgraph.com/docs/superwidget
 * 
 * Date: __BUILD_DATE__
 */

"use strict";

// ES6 Imports
import YesGraphAPI from "./sdk.js";
import Model from "./modules/model.js";
import View from "./modules/view.js";
import Controller from "./modules/controller.js";
import AnalyticsManager from "./modules/analytics.js";
import { YesGraphAPI } from "./modules/yesgraph.js";
import { PROTOCOL } from "./modules/consts.js";

var VERSION = "dev/__SUPERWIDGET_VERSION__";
var SDK_VERSION = "dev/__SDK_VERSION__"; // jshint ignore:line
var CSS_VERSION = "dev/__CSS_VERSION__";
var LIBRARY = {
    name: "yesgraph-invites.js",
    version: VERSION
};
var EVENTS = {
    LOAD_SUPERWIDGET: "Loaded Superwidget",
    CLICK_CONTACT_IMPORT_BTN: "Clicked Contact Import Button",
    CLICK_SOCIAL_MEDIA_BTN: "Clicked Social Media Button",
    CLICK_COPY_LINK: "Clicked to Copy Invite Link",
    SUGGESTED_SEEN: "Viewed Suggested Contacts",
    INVITES_SENT: "Invite(s) Sent",
    CLIPBOARD_FAILED: "Clipboard Failed to Load"
};

function requireScript(globalVar, script, func) {
    // Get the specified script if it hasn't been loaded already
    if (window.hasOwnProperty(globalVar)) {
        func(window[globalVar]);
    } else {
        return (function (d, t) {
            var g = d.createElement(t);
            var s = d.getElementsByTagName(t)[0];
            g.src = script;
            s.parentNode.insertBefore(g, s);
            if (typeof func === "function") {
                g.onload = function () {
                    func(window[globalVar]);
                };
            }
        }(document, 'script'));
    }
}

function Superwidget() {
    var self = this;

    this.isReady = false;

    this.init = function(options, model, view) {
        if (!self.YesGraphAPI) {
            // This state should never occur, but this is a sane default behavior
            throw new Error("YesGraph Error: Unmounted Superwidget. " +
                            "Use YesGraphAPI.mount(superwidget) before calling superwidget.init()");
        }
        self.options = options || undefined;

        // Configure the model, view, & controller
        self.model = model || self.model || new Model();
        self.view = view || new View();
        self.controller = self.controller || new Controller(self.model, self.view);
        self.model.Superwidget = self;
        self.view.Superwidget = self;
        self.controller.Superwidget = self;

        self.modal = self.view.modal; // shortcut for operating the view modal

        self.model.waitForAPIConfig();
    };
}
// Once the SDK script has been loaded, initialize the Superwidget
var SDK_URL = PROTOCOL + "//cdn.yesgraph.com/" + SDK_VERSION + "/yesgraph.min.js";
requireScript("YesGraphAPI", SDK_URL, function(YesGraphAPI) {
    console.log("It worked!")
    var superwidget = new Superwidget();
    YesGraphAPI.mount(superwidget);
    YesGraphAPI.Superwidget.init();
});
