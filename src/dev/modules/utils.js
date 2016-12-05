export function isObject(o) {
  return null != o && toString.call(o) === '[object Object]';
}

export function requireScript(globalVar, script, func) {
    // Get the specified script if it hasn't been loaded already
    if (window.hasOwnProperty(globalVar)) {
        if (func) {
            func(window[globalVar]);
        }
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
