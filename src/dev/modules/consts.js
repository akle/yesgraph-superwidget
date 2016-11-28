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
var YESGRAPH_BASE_URL;
var YESGRAPH_API_URL;
var PUBLIC_RAVEN_DSN;
var RUNNING_LOCALLY;

// Initialize in dev-mode as appropriate
if (["localhost", "lvh.me"].indexOf(window.location.hostname) !== -1 && window.document.title === 'YesGraph') {
    YESGRAPH_BASE_URL = "http://localhost:5001";
    PUBLIC_RAVEN_DSN = "https://26657ee86c48458ea5c65e27de766715@app.getsentry.com/81078";
    RUNNING_LOCALLY = true;
} else {
    YESGRAPH_BASE_URL = "https://api.yesgraph.com";
    PUBLIC_RAVEN_DSN = "https://2f5e2b0beb494197b745f10f9fca6c9d@app.getsentry.com/79844";
    RUNNING_LOCALLY = false;
}
YESGRAPH_API_URL = YESGRAPH_BASE_URL + '/v0';

// Check the protocol used by the window
var PROTOCOL;
if (window.location.protocol.indexOf("http") !== -1) {
    PROTOCOL = window.location.protocol;
} else {
    PROTOCOL = "http:";
}

module.exports = {
    SUPERWIDGET_VERSION: SUPERWIDGET_VERSION,
    SDK_VERSION: SDK_VERSION,
    CSS_VERSION: CSS_VERSION,
    LIBRARY: LIBRARY,
    EVENTS: EVENTS,
    YESGRAPH_API_URL: YESGRAPH_API_URL,
    RUNNING_LOCALLY: RUNNING_LOCALLY,
    PUBLIC_RAVEN_DSN: PUBLIC_RAVEN_DSN,
    PROTOCOL: PROTOCOL
};
