var gulp = require("gulp");
var prompt = require("gulp-prompt");
var replace = require("gulp-replace");
var config = require("../config");

var __OLD_SDK_VERSION__ = config.version.sdk;
var __OLD_SUPERWIDGET_VERSION__ = config.version.superwidget;
var __OLD_CSS_VERSION__ = config.version.css;

var __NEW_SDK_VERSION__;
var __NEW_SUPERWIDGET_VERSION__;
var __NEW_CSS_VERSION__;

gulp.task("getVersion", function() {
    return gulp.src(config.tasks.version.files, {base: config.src.root})
        .pipe(prompt.prompt([{
            type: 'input',
            name: 'sdk_version',
            message: 'Which SDK version should be used for this build?'
        },
        {
            type: 'input',
            name: 'superwidget_version',
            message: 'Which Superwidget version should be used for this build?'
        },
        {
            type: 'input',
            name: 'css_version',
            message: 'Which CSS version should be used for this build?'
        }], function(res) {
            __NEW_SDK_VERSION__ = res.sdk_version;
            __NEW_SUPERWIDGET_VERSION__ = res.superwidget_version;
            __NEW_CSS_VERSION__ = res.css_version;
        }));
});

gulp.task("version", ["getVersion"] , function() {
    return gulp.src(config.tasks.version.files, {base: config.src.root})
        .pipe(replace("__SDK_VERSION__", __NEW_SDK_VERSION__))
        .pipe(replace("__SUPERWIDGET_VERSION__", __NEW_SUPERWIDGET_VERSION__))
        .pipe(replace("__CSS_VERSION__", __NEW_CSS_VERSION__))
        .pipe(gulp.dest(config.dest.root));
});
