var gulp = require('gulp');
var prompt = require("gulp-prompt");
var semver = require("semver");
var replace = require("gulp-replace");
var filter = require('gulp-filter');

var config = require("../config");
var oldVersions = config.version;
var newVersions = {};


gulp.task("version", function() {

    var sourceCodeFilter = filter("dist/**/yesgraph?(-invites)?(.min).@(js|css)", { restore: true });
    var packageFilter = filter("package.json", { restore: true });
    var configFilter = filter("gulp/config.js", { restore: true });

    var CURRENT_DATE = new Date();
    var updateMessage = "Which type of update should be used for the ";
    var updateChoices = ["none", "patch", "minor", "major"];

    return gulp.src(config.tasks.version.files)

        // Check which type of update we should do
        .pipe(prompt.prompt([{
            type: 'list',
            name: 'sdk',
            message: updateMessage + 'SDK?',
            choices: updateChoices
        },
        {
            type: 'list',
            name: 'superwidget',
            message: updateMessage + 'Superwidget?',
            choices: updateChoices
        },
        {
            type: 'list',
            name: 'css',
            message: updateMessage + 'CSS?',
            choices: updateChoices
        }], function(res) {
            ["sdk", "superwidget", "css"].forEach(function(file){
                updateType = res[file];
                if (updateType === "none") {
                    newVersions[file] = oldVersions[file];
                } else {
                    newVersions[file] = semver.inc(oldVersions[file], updateType);
                }
                console.log(file + ":", newVersions[file]);
            });
        }))

        // Update version in code files
        .pipe(sourceCodeFilter)
        .pipe(replace(/__(\w*)_VERSION__/g, fileVersionReplacer))
        .pipe(replace(/__BUILD_DATE__/g, CURRENT_DATE))
        .pipe(gulp.dest("."))
        .pipe(sourceCodeFilter.restore)

        // Update version in package.json
        .pipe(packageFilter)
        .pipe(replace(/"version": ?"\S*"/, packageVersionReplacer))
        .pipe(gulp.dest("."))
        .pipe(packageFilter.restore)

        // Update config file to persist version change
        .pipe(configFilter)
        .pipe(replace(/__(\w*)_VERSION__ ?\= ?[\'\"]\S*[\'\"];/g, configVersionReplacer))
        .pipe(gulp.dest("./gulp"))
        .pipe(configFilter.restore);
});

function fileVersionReplacer(match, target) {
    return newVersions[target.toLowerCase()]
}

function configVersionReplacer(match, target) {
    var version = newVersions[target.toLowerCase()]
    return '__' + target.toUpperCase() + '_VERSION__ = "' + version + '";';
}

function packageVersionReplacer(match) {
    return '"version": "' + newVersions.superwidget.replace(/^v/, "") + '"' // strip version prefix "v"
}