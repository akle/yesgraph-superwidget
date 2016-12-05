var defaultParsedOptions = {
    auth: {
        app: null,
        clientKey: null,
    },
    settings: {
        testmode: false,
        target: ".yesgraph-invites",
        promoteMatchingDomain: false,
        contactImporting: true,
        showContacts: true,
        emailSending: true,
        inviteLink: true,
        shareBtns: true,
        nolog: false
    },
    user: {},
    warnings: {
        loadedDefaultParams: false
    }
};

function parseStructuredOptions(options) {
    var parsed = $.extend({}, defaultParsedOptions);

    for (let section in defaultParsedOptions) {
        options[section] = options[section] || {};

        for (let opt in defaultParsedOptions[section]) {
            if (options[section][opt] === undefined) {
                parsed[section][opt] = defaultParsedOptions[section][opt];
            } else {
                parsed[section][opt] = options[section][opt];
            }
        }
    }
    return parsed;
}

function parseBasicOptions(options) {
    var parsed = $.extend({}, defaultParsedOptions);
    for (let opt in options) {
        let val = options[opt];
        // Sort options in to the right sections
        if (parsed.auth.hasOwnProperty(opt)) {
            parsed.auth[opt] = val;
        } else if (parsed.settings.hasOwnProperty(opt)) {
            parsed.settings[opt] = val;
        } else {
            parsed.user[opt] = val;
        }
        // Detect whether the developer used `CURRENT_USER_*` in their HTML
        if (typeof val === "string" && val.slice(0,12) == "CURRENT_USER") {
            parsed.warnings.loadedDefaultParams = true;
        }
    }
    return parsed;
}

function optionsAreStructured(options) {
    for (let key in options) {
        if (defaultParsedOptions[key] === undefined) return false;
    }
    return true;
}

export function parseOptions(options) {
    var parsed;
    if (optionsAreStructured(options)) {
        parsed = parseStructuredOptions(options);
    } else {
        parsed = parseBasicOptions(options);
    }
    return parsed;
}

export default function waitForOptions(optionsDeferred) {
    // Check the dom periodically until we find an
    // element with the id `yesgraph` to get options from,
    // or until the .options() method is called.
    var d = optionsDeferred || jQuery.Deferred();
    var target;
    var options;
    var timer = setInterval(function() {
        target = jQuery("#yesgraph");
        if (target.length > 0) {
            options = target.data();
            d.resolve(parseOptions(options));
        }
    }, 100);
    d.always(function(){ clearInterval(timer); });
    return d.promise();
}
