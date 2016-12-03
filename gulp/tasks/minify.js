"use strict";

var gulp = require("gulp");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var cleanCSS = require("gulp-clean-css");
var clone = require("gulp-clone");
var sourcemaps = require("gulp-sourcemaps");
var debug = require('gulp-debug');
var config = require("../config");

var browserify = require('browserify');
var babelify = require('babelify');

var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var sourceStream = require('vinyl-source-stream');

var merge = require("merge-stream");

gulp.task("minify", ["minify:js", "minify:css"]);

gulp.task("minify:js", function(){
    var streams = merge(), stream_, bundler, cloneSink;

    // Log file names to stdout as they're processed
    streams.pipe(debug({title: "minify:js"}));

    // Loop through dev & prod versions of the SDK
    // and the Superwidget, bundling & renaming each one
    config.tasks.minify.js.forEach(function(file){
        // Bundle the modules into a single file,
        // and convert it all from ES6 > ES5

        // We use cloneSink here to create a copy of the files, then minify
        // only the copies (so that an unminified version is preserved).
        cloneSink = clone.sink();

        // Create a pipe to bundle & minify the code
        stream_ = browserify({
                entries: file.input,
                debug: true,
            })
            .transform(babelify, { presets: ['es2015'] })
            .bundle()
            .pipe(sourceStream(file.output))
            .pipe(buffer())
            .pipe(cloneSink)
            .pipe(sourcemaps.init({ loadMaps: true }))
            .pipe(uglify({ preserveComments: 'license' }))
            .pipe(rename({suffix: ".min"}))
            .pipe(sourcemaps.write(".")) // save sourcemaps in dest/
            .pipe(cloneSink.tap())
            .pipe(gulp.dest(config.dest.root))

        streams.add(stream_);
    });

    // Return the merged streams
    return streams;
});

gulp.task("minify:css", function() {
    return gulp.src(config.tasks.minify.less, {base: config.dest.root})
        .pipe(debug({title: "minify:css"}))
        .pipe(cleanCSS({keepSpecialComments: 1}))
        .pipe(rename({suffix: ".min"}))
        .pipe(gulp.dest(config.dest.root));
});
