"use strict";
var argv = require("yargs").argv;
var aws = require("gulp-awspublish");
var clone = require("gulp-clone")
var cloudfront = require('gulp-cloudfront-invalidate');
var filter = require("gulp-filter");
var gulp = require("gulp");
var if_ = require("gulp-if");
var lazypipe = require("lazypipe");
var rename = require("gulp-rename");
var release = require("gulp-github-release");
var debug = require("gulp-debug");

var sdkFiles = ["yesgraph.js", "yesgraph.min.js", "yesgraph.min.js.map"];
var superwidgetFiles = ["yesgraph-invites.js", "yesgraph-invites.min.js", "yesgraph-invites.min.js.map"];
var cssFiles = ["yesgraph-invites.css", "yesgraph-invites.min.css"];

/*
 * This task handles the entire deploy process from start to finish,
 * but executes different task sequences based on whether we're updating
 * dev versions, prod versions, or simply running a test deploy locally.
 *
 * Options:
 * --dev    update only files from the /dev folder
 * --test   don't deploy; save processed files in /deployed folder
 *
 * Example: Normal deploy. Process all files, and deploy to S3/Cloudfront
 * `$ gulp deploy`
 *
 * Example: Process all files, and save locally instead of deploying.
 * `$ gulp deploy --test`
 *
 * Example: Process only files in the /dev folder, and deploy to S3/Cloudfront.
 * `$ gulp deploy --dev`
 */

gulp.task("deploy", ["build"], function() {
    var config = require("../config");  // Load config after versioning
    var devFiles = "dist/dev/**/*.@(js|css|map)";
    var publisher = aws.create(config.s3);
    var cloneSink = clone.sink();

    var filesChanged = argv.dev ? "dev" : "all";
    var deployType = argv.test ? "test" : "live";
    console.log("Running", deployType, "deploy on", filesChanged, "files...");

    var deployPrep = lazypipe()
        .pipe(function(){
            // We use cloneSink here to create a copy of the files and rename
            // only the copies (so that they can be sorted by version in S3).
            return cloneSink;
        })
        .pipe(rename, function(path){
            // Add versions to the filepath
            var filename = path.basename + path.extname;
            if (cssFiles.indexOf(filename) !== -1) {
                path.dirname += "/" + config.version.css;
            } else if (superwidgetFiles.indexOf(filename) !== -1) {
                path.dirname += "/" + config.version.superwidget;
            } else if (sdkFiles.indexOf(filename) !== -1) {
                path.dirname += "/" + config.version.sdk;
            }
        })
        .pipe(function(){
            // Use both the clones & the originals from now on
            return cloneSink.tap();
        });

    if (!argv.test) {
        return gulp.src(config.tasks.deploy.files)
            .pipe(deployPrep())
            .pipe(if_(isDevDeploy, filter(devFiles))) // only update files in the dev/ folder
            .pipe(debug({title: "deploy"}))
            .pipe(publisher.publish({}, {force: true}))
            .pipe(aws.reporter())
            .pipe(cloudfront(config.cloudfront))
            .pipe(release({
                manifest: require("../../package.json")
            }));
    } else if (argv.test) {
        return gulp.src(config.tasks.deploy.files)
            .pipe(deployPrep())
            .pipe(if_(isDevDeploy, filter(devFiles))) // only update files in the dev/ folder
            .pipe(debug({title: "deploy"}))
            .pipe(gulp.dest("deployed"));
    }
});

function startsWith (str, substr) {
    return str.slice(0,substr.length) === substr;
}

function isDevDeploy() {
    return argv.dev === true;
}
