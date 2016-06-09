var gulp = require("gulp");
var prompt = require("gulp-prompt");
var replace = require("gulp-replace");
var config = require("../config");
var __SDK_VERSION__;
var __SUPERWIDGET_VERSION__;
var __CSS_VERSION__;

gulp.task("getVersion", function(){
    return gulp.src(config.tasks.version.files)
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
        }], function(res){
            __SDK_VERSION__ = res.sdk_version;
            __SUPERWIDGET_VERSION__ = res.superwidget_version;
            __CSS_VERSION__ = res.css_version;
        }));
});

gulp.task("version", ["getVersion"] , function(){
    return gulp.src(config.tasks.version.files)
        .pipe(replace("__SDK_VERSION__", __SDK_VERSION__))
        .pipe(replace("__SUPERWIDGET_VERSION__", __SUPERWIDGET_VERSION__))
        .pipe(replace("__CSS_VERSION__", __CSS_VERSION__))
        .pipe(gulp.dest(config.dest.root));
});
