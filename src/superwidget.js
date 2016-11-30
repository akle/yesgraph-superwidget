import YesGraphAPI from "./sdk.js";
import Model from "./modules/model.js";
import View from "./modules/view.js";
import Controller from "./modules/controller.js";

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

// Initialize the Superwidget
var superwidget = new Superwidget();
YesGraphAPI.mount(superwidget);
YesGraphAPI.Superwidget.init();
