var SUPERWIDGET_VERSION = "dev/__SUPERWIDGET_VERSION__";
var SDK_VERSION = "dev/__SDK_VERSION__";
var CSS_VERSION = "dev/__CSS_VERSION__";
var LIBRARY = {
    name: "yesgraph-invites.js",
    version: SUPERWIDGET_VERSION
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
var YESGRAPH_BASE_URL = "__CONST_YESGRAPH_BASE_URL__";
var YESGRAPH_API_URL = YESGRAPH_BASE_URL + '/v0';
var PUBLIC_RAVEN_DSN = "__CONST_PUBLIC_RAVEN_DSN__";
var RUNNING_LOCALLY = "__CONST_RUNNING_LOCALLY__" === "true" ? true : false;

// Check the protocol used by the window
var PROTOCOL = (window.location.protocol.slice(0,4) == "http") ? window.location.protocol : "http:";

export {
    SUPERWIDGET_VERSION,
    SDK_VERSION,
    CSS_VERSION,
    LIBRARY,
    EVENTS,
    YESGRAPH_API_URL,
    RUNNING_LOCALLY,
    PUBLIC_RAVEN_DSN,
    PROTOCOL
};
