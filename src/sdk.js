import YesGraphAPIConstructor from "./modules/api.js";
import { requireScript } from "./modules/utils.js";

var YesGraphAPI = new YesGraphAPIConstructor();
window.YesGraphAPI = YesGraphAPI;

requireScript("jQuery", "https://code.jquery.com/jquery-2.1.1.min.js", function(){
    YesGraphAPI.install();
});

export default YesGraphAPI;
