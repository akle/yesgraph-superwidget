"use strict";
var gulp = require("gulp");
var config = require("../config");

gulp.task("_js", ["version"], function(){
	return gulp.start("minify:js");
});

gulp.task("watch", function(){
    gulp.watch(config.tasks.watch.files.js, ["_js"]);
    gulp.watch(config.tasks.watch.files.less, ["compile:less"]);
});