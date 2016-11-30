"use strict";
var gulp = require("gulp");
var replace = require("gulp-replace");
var config = require("../config");
var debug = require("gulp-debug");

gulp.task("update", function() {
    return gulp.src(config.tasks.update.files)
        .pipe(debug({title: "update"}))
        .pipe(replace(/dev\/(__\w*_VERSION__)/g, "$1")) // Strip "dev/" prefix
        .pipe(gulp.dest(config.src.root));
});
