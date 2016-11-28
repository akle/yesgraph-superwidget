/*!
 * YesGraph Superwidget dev/__SUPERWIDGET_VERSION__
 *
 * https://www.yesgraph.com
 * https://docs.yesgraph.com/docs/superwidget
 * 
 * Date: __BUILD_DATE__
 */

"use strict";

import YesGraphAPI from "./sdk.js";
import Model from "./modules/model.js";
import View from "./modules/view.js";
import Controller from "./modules/controller.js";
import { requireScript } from "./modules/utils.js";
import { PROTOCOL, SDK_VERSION } from "./modules/consts.js";

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
