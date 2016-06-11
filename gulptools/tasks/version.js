var gulp = require("gulp");
var prompt = require("gulp-prompt");
var replace = require("gulp-replace");
var fs = require("fs");
var config = require("../config");

var __OLD_SDK_VERSION__ = config.version.sdk;
var __OLD_SUPERWIDGET_VERSION__ = config.version.superwidget;
var __OLD_CSS_VERSION__ = config.version.css;

var __NEW_SDK_VERSION__;
var __NEW_SUPERWIDGET_VERSION__;
var __NEW_CSS_VERSION__;

function bump(version, updateType) {
    if (updateType === "NONE") {
        return version;
    }
    var pattern = /^v(\d*).(\d*).(\d*)$/;
    var updated = (version.match(pattern) || []).slice(1);
    if (updateType === "PATCH") {
        updated[2] = String(Number(updated[2]) + 1);
    } else if (updateType === "MINOR") {
        updated[1] = String(Number(updated[1]) + 1);
        updated[2] = "0";
    } else if (updateType === "MAJOR") {
        updated[0] = String(Number(updated[0]) + 1);
        updated[1] = "0";
        updated[2] = "0";
    }
    return "v" + updated.join(".");
}

gulp.task("getVersion", function() {
    return gulp.src(config.tasks.version.files, {base: config.src.root})
        .pipe(prompt.prompt([{
            type: 'list',
            name: 'sdk_update_type',
            message: 'Which type of bump shoud be used for the SDK?',
            choices: ["NONE", "PATCH", "MINOR", "MAJOR"]
        },
        {
            type: 'list',
            name: 'superwidget_update_type',
            message: 'Which type of bump shoud be used for the Superwidget?',
            choices: ["NONE", "PATCH", "MINOR", "MAJOR"]
        },
        {
            type: 'list',
            name: 'css_update_type',
            message: 'Which type of bump shoud be used for the CSS?',
            choices: ["NONE", "PATCH", "MINOR", "MAJOR"]
        }], function(res) {
            __NEW_SDK_VERSION__ = bump(__OLD_SDK_VERSION__, res.sdk_update_type);
            __NEW_SUPERWIDGET_VERSION__ = bump(__OLD_SUPERWIDGET_VERSION__, res.superwidget_update_type);
            __NEW_CSS_VERSION__ = bump(__OLD_CSS_VERSION__, res.css_update_type);
            console.log("SDK Version:", __NEW_SDK_VERSION__);
            console.log("Superwidget Version:", __NEW_SUPERWIDGET_VERSION__);
            console.log("CSS Version:", __NEW_CSS_VERSION__);
        }));
});

gulp.task("version", ["getVersion"] , function() {
    // Update the config file to persist the version change
    var sdk_re = /(__SDK_VERSION__ ?\= ?[\'\"])(\S*)([\'\"];)/;
    var superwidget_re = /(__SUPERWIDGET_VERSION__ ?\= ?[\'\"])(\S*)([\'\"];)/;
    var css_re = /(__CSS_VERSION__ ?\= ?[\'\"])(\S*)([\'\"];)/;
    gulp.src(__dirname + "/../config.js")
        .pipe(replace(sdk_re, "$1" + __NEW_SDK_VERSION__ + "$3"))
        .pipe(replace(superwidget_re, "$1" + __NEW_SUPERWIDGET_VERSION__ + "$3"))
        .pipe(replace(css_re, "$1" + __NEW_CSS_VERSION__ + "$3"))
        .pipe(gulp.dest(__dirname + "/../"));

    // Update each of the code files
    var CURRENT_DATE = new Date();
    return gulp.src(config.tasks.version.files, {base: config.src.root})
        .pipe(replace("__SDK_VERSION__", __NEW_SDK_VERSION__))
        .pipe(replace("__SUPERWIDGET_VERSION__", __NEW_SUPERWIDGET_VERSION__))
        .pipe(replace("__CSS_VERSION__", __NEW_CSS_VERSION__))
        .pipe(replace("__BUILD_DATE__", CURRENT_DATE))
        .pipe(gulp.dest(config.dest.root));
});
