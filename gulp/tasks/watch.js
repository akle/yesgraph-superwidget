"use strict";
var gulp = require("gulp");
var gutil = require('gulp-util');
var config = require("../config");

gulp.task("_js", ["minify:js"], function(){
	return gulp.start("version");
});

gulp.task("watch", function(){
    gulp.watch(config.tasks.watch.files.js, ["_js"]);
    gulp.watch(config.tasks.watch.files.less, ["compile:less"]);
});
