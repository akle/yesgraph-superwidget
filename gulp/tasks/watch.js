"use strict";
var gulp = require("gulp");
var gutil = require('gulp-util');
var config = require("../config");
var sequence = require("run-sequence").use(gulp);

gulp.task("_js", function(done) {
    return sequence("bundle", "consts", "version", "minify", done);
});

gulp.task("watch", function(){
    gulp.watch(config.tasks.watch.files.js, ["_js"]);
    gulp.watch(config.tasks.watch.files.less, ["compile:less"]);
});
