export function requireScript(globalVar, script, func) {
    // Get the specified script if it hasn't been loaded already
    if (window.hasOwnProperty(globalVar)) {
        func(window[globalVar]);
    } else {
        return (function(d, t) {
            var g = d.createElement(t),
                s = d.getElementsByTagName(t)[0];
            g.src = script;
            s.parentNode.insertBefore(g, s);
            if (func) {
                g.onload = function() {
                    func(window[globalVar]);
                };
            }
        }(document, 'script'));
    }
}

export function waitForYesGraphTarget() {
    // Check the dom periodically until we find an
    // element with the id `yesgraph` to get settings from
    var d = jQuery.Deferred(), target,
        timer = setInterval(function() {
            target = jQuery("#yesgraph");
            if (target.length > 0) {
                var options = target.data();
                d.resolve(options);
            }
        }, 100);
    d.always(function(){ clearInterval(timer); });
    return d.promise();
}
