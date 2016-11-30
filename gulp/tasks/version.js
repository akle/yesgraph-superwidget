"use strict";
var argv = require("yargs").argv;
var config = require("../config");
var gulp = require('gulp');
var replace = require("gulp-replace");
var semver = require("semver");
var debug = require("gulp-debug");
var banner = require("gulp-banner");
var merge = require("merge-stream");
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
    setUpdateType();
    var stream_;
    var streams = merge();
    var headerInfo = {
        sdk: {
            title: "YesGraph Javascript SDK",
            docs: "/javascript-sdk",
        },
        superwidget: {
            title: "YesGraph Superwidget",
            docs: "/superwidget",
        },
        css: {
            title: "YesGraph Superwidget CSS",
            docs: "/superwidget-styling",
        }
    };
    var header = [
        '/*!',
        ' * <%= info.title %> <%= version %>',
        ' *',
        ' * https://www.yesgraph.com',
        ' * https://docs.yesgraph.com/docs<%= info.docs %>',
        ' *',
        ' * Date: <%= currentDate %>',
        '*/\n\n'
    ].join("\n");

    // Log file names to stdout as they're processed
    streams.pipe(debug({ title: "version"}));

    // Loop through the necessary files creating a stream for each one
    // based on how it should be processed, then merge all the streams together.
    config.tasks.version.files.forEach(function(file) {
        // Version the package.json file & store it at the root
        if (file.type === "package") {
            stream_ = gulp.src(file.path)
                .pipe(replace(/"version": ?"\S*"/, packageVersionReplacer))
                .pipe(gulp.dest(config.root))

        // Version the config.js file & store it in the gulp/ folder
        } else if (file.type === "config") {
            stream_ = gulp.src(file.path)
                .pipe(replace(/__(\w*)_VERSION__ ?\= ?[\'\"]\S*[\'\"];/g, configVersionReplacer))
                .pipe(gulp.dest(config.root + "/gulp"))

        // Version the source code files & store them in the dist/ folder
        } else {
            stream_ = gulp.src(file.path, {base: config.dest.root})
                .pipe(banner(header, {
                    info: headerInfo[file.type],
                    currentDate: new Date(),
                    version: file.versionPrefix + versions[file.type]
                }))
                .pipe(replace(/__(\w*)_VERSION__/g, fileVersionReplacer))
                .pipe(gulp.dest(config.dest.root));
        }
        streams.add(stream_);
    });

    return streams;
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
