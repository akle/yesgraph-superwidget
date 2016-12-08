/*
Reads data attributes from the HTML widget span. 
*/

// Default options to be overwritten by data-attributes on the HTML widget span.
export var defaultParsedOptions = {
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
        optionsId: 'default',
        nolog: false
    },
    user: {},
    warnings: {
        loadedDefaultParams: false
    }
};

export default function waitForOptions(optionsDeferred) {
    /* 
    Check the dom periodically until we find an
    element with the id `yesgraph` to get options from,
    or until the .setOptions() method is called.
    */
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

export function parseOptions(options) {
    /*
    Merges the default widget options and the options retrieved from the server's api/views/superwidget endpoint.
    */
    var parsed;
    
    // If the user has not added any attributes to the widget, simply take those options
    if (optionsAreStructured(options)) {
        parsed = $.extend(true, {}, defaultParsedOptions, options);
    } 
    
    // If the user has added their own attributes, parse them and add them to the dictionary.
    else {
        parsed = $.extend(true, {}, defaultParsedOptions);
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
    }
    return parsed;
}

function optionsAreStructured(options) {
    /* 
    Checks if the user has added any attributes to the widget.
    */
    for (let key in options) {
        if (defaultParsedOptions[key] === undefined) return false;
    }
    return true;
}
