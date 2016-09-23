"use strict";
var gulp = require("gulp");
var rename = require("gulp-rename");
var less = require("gulp-less");
var autoprefixer = require("gulp-autoprefixer");
var debug = require("gulp-debug");
var config = require("../config");

gulp.task("compile:less", function() {
    return gulp.src(config.tasks.compileLess.files, {base: config.src.root})
        .pipe(debug({title: "compile:less"}))
        .pipe(less())
        .pipe(rename({extname: ".css"}))
        // This is commented out because it's breaking our build and
        // preventing the next tasks from running properly. It would
        // be good to add it back at some point, but it's not urgent
        // because our existing CSS doesn't require autoprefixing.
        //
        // .pipe(autoprefixer({
        //     browsers: ["last 2 versions"]
        // }))
        .pipe(gulp.dest(config.dest.root));
});
