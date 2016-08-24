"use strict";
var argv = require("yargs").argv;
var config = require("../config");
var filter = require('gulp-filter');
var gulp = require('gulp');
var prompt = require("gulp-prompt");
var replace = require("gulp-replace");
var semver = require("semver");
var versions = config.version;

/*
 * This task handles versioning process, updating version numbers on each
 * file according to the command line options specified.
 *
 * Options:
 * --update:patch [files]
 * --update:minor [files]
 * --update:major [files]
 *
 * Example: Patch the SDK and the Superwidget, do nothing to the CSS
 * `$ gulp version --update:patch sdk,superwidget`
 *
 * Example: Minor update on the Superwidget, patch the CSS, do nothing to the SDK
 * `$ gulp version --update:minor superwidget --update:patch css`
 */
gulp.task("version", function() {

    var sourceCodeFilter = filter("**/yesgraph?(-invites)?(.min).@(js|css|map)", { restore: true });
    var packageFilter = filter("package.json", { restore: true });
    var configFilter = filter("gulp/config.js", { restore: true });
    var CURRENT_DATE = new Date();

    setUpdateType();

    return gulp.src(config.tasks.version.files)

        // Update version in code files
        .pipe(sourceCodeFilter)
        .pipe(replace(/__(\w*)_VERSION__/g, fileVersionReplacer))
        .pipe(replace(/__BUILD_DATE__/g, CURRENT_DATE))
        .pipe(gulp.dest(".")) // stores code in dist/ folder
        .pipe(sourceCodeFilter.restore)

        // Update version in package.json
        .pipe(packageFilter)
        .pipe(replace(/"version": ?"\S*"/, packageVersionReplacer))
        .pipe(gulp.dest(".")) // stores package.json at root
        .pipe(packageFilter.restore)

        // Update config file to persist version change
        .pipe(configFilter)
        .pipe(replace(/__(\w*)_VERSION__ ?\= ?[\'\"]\S*[\'\"];/g, configVersionReplacer))
        .pipe(gulp.dest("./gulp")) // stores config.js in gulp/ folder
        .pipe(configFilter.restore)
});

function fileVersionReplacer(match, target) {
    return versions[target.toLowerCase()]
}

function configVersionReplacer(match, target) {
    var version = versions[target.toLowerCase()]
    return '__' + target.toUpperCase() + '_VERSION__ = "' + version + '";';
}

function packageVersionReplacer(match) {
    
    return '"version": "' + versions.superwidget.replace(/^v/, "") + '"' // strip version prefix "v"
}

function setUpdateType() {
    // Loop through the valid update types and check the command line args
    // for any files specified with that update type
    ["patch", "minor", "major"].forEach(function(updateType){
        var filesToUpdate = argv["update:" + updateType];
        if (!filesToUpdate) return;
        // Loop through files specified for this update type and
        // set the new version numbers based on the update type
        filesToUpdate.split(",").forEach(function(file){
            versions[file] = 'v' + semver.inc(versions[file], updateType);
        });
    });
}
