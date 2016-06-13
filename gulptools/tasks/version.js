var gulp = require("gulp");
var prompt = require("gulp-prompt");
var replace = require("gulp-replace");
var fs = require("fs");
var config = require("../config");

var oldVersions = config.version;
var newVersions = {
    sdk: undefined,
    superwidget: undefined,
    css: undefined
}

gulp.task("_getVersion", function() {
    return gulp.src(config.tasks.version.files, {base: config.src.root})
        .pipe(prompt.prompt([{
            type: 'list',
            name: 'sdk_update_type',
            message: 'Which type of update should be used for the SDK?',
            choices: ["NONE", "PATCH", "MINOR", "MAJOR"]
        },
        {
            type: 'list',
            name: 'superwidget_update_type',
            message: 'Which type of update should be used for the Superwidget?',
            choices: ["NONE", "PATCH", "MINOR", "MAJOR"]
        },
        {
            type: 'list',
            name: 'css_update_type',
            message: 'Which type of update should be used for the CSS?',
            choices: ["NONE", "PATCH", "MINOR", "MAJOR"]
        }], function(res) {
            newVersions.sdk = getNewVersion(oldVersions.sdk, res.sdk_update_type)
            newVersions.superwidget = getNewVersion(oldVersions.superwidget, res.superwidget_update_type)
            newVersions.css = getNewVersion(oldVersions.css, res.css_update_type)
            console.log("SDK Version:", newVersions.sdk);
            console.log("Superwidget Version:", newVersions.superwidget);
            console.log("CSS Version:", newVersions.css);
        }));
});

gulp.task("version", ["_getVersion"] , function() {
    // Update the config file to persist the version change
    gulp.src(__dirname + "/../config.js")
        .pipe(replace(/__(\w*)_VERSION__ ?\= ?[\'\"]\S*[\'\"];/, configVersionReplacer))
        .pipe(gulp.dest(__dirname + "/../"));

    // Update each of the code files
    var CURRENT_DATE = new Date();
    return gulp.src(config.tasks.version.files, {base: config.src.root})
        .pipe(replace(/__(\w*)_VERSION__/, fileVersionReplacer))
        .pipe(replace("__BUILD_DATE__", CURRENT_DATE))
        .pipe(gulp.dest(config.dest.root));
});

function getNewVersion(version, updateType) {
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

function fileVersionReplacer(match, target) {
    return newVersions[target.toLowerCase()]
}

function configVersionReplacer(match, target) {
    var version = newVersions[target.toLowerCase()]
    return '__' + target + '_VERSION__ = "' + version + '";';
}