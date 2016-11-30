import YesGraphAPIConstructor from "./modules/api.js";
import { requireScript } from "./modules/utils.js";

var YesGraphAPI = new YesGraphAPIConstructor();

// Expose both the instance & the constructor to the developer
window.YesGraphAPI = YesGraphAPI;
window.YesGraphAPIConstructor = YesGraphAPIConstructor;

// Wait for jQuery to be available before configuring the YesGraphAPI object
requireScript("jQuery", "https://code.jquery.com/jquery-2.1.1.min.js", YesGraphAPI.install);

// Export the YesGraphAPI object, so that we can use it
// as a dependency of the superwidget script.
export default YesGraphAPI;
