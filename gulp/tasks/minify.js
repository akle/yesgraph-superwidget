"use strict";
var gulp = require("gulp");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var cleanCSS = require("gulp-clean-css");
var sourcemaps = require("gulp-sourcemaps");
var debug = require('gulp-debug');
var config = require("../config");

var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var source = require('vinyl-source-stream');

var watchify = require('watchify');
var babel = require('babelify');
var through = require("through2");

gulp.task("minify", ["minify:js", "minify:css"]);

gulp.task("minify:js", ["minify:js:sdk", "minify:js:superwidget"]);

gulp.task("minify:js:superwidget", function(){
    var bundler = browserify({
        entries: "./src/dev/superwidget.js",
        debug: true
    }).transform('babelify', { presets: ['es2015' ]});
    return bundler.bundle()
        .pipe(source('yesgraph-invites.js'))
        .pipe(buffer())
        .pipe(debug({title: "minify:js"}))
        .pipe(gulp.dest(config.dest.root));
});

gulp.task("minify:js:sdk", function(){
    var bundler = browserify({
        entries: "./src/dev/sdk.js",
        debug: true
    }).transform('babelify', { presets: ['es2015' ]});
    return bundler.bundle()
        .pipe(source('yesgraph.js'))
        .pipe(buffer())
        .pipe(debug({title: "minify:js"}))
        .pipe(gulp.dest(config.dest.root));
});

gulp.task("minify:css", function() {
    return gulp.src(config.tasks.minifyCss.files, {base: config.dest.root})
        .pipe(debug({title: "minify:css"}))
        .pipe(cleanCSS({keepSpecialComments: 1}))
        .pipe(rename({suffix: ".min"}))
        .pipe(gulp.dest(config.dest.root));
});


// SOURCEMAPS SNIPPET
// 
// .pipe(sourcemaps.init())
// .pipe(babel({
//     presets: ['es2015']
// }))
// .pipe(uglify({preserveComments: "license"}))
// .pipe(rename({suffix: ".min"}))
// .pipe(sourcemaps.write("."))
