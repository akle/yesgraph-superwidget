"use strict";

var gulp = require("gulp");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var less = require("gulp-less");
var cleanCSS = require('gulp-clean-css');

gulp.task("minifyScripts", function(){
    function minify(src, dest) {
        return gulp.src(src)
            .pipe(uglify())
            .pipe(rename({suffix: ".min"}))
            .pipe(gulp.dest(dest));
    }
    minify(["dev/yesgraph.js","dev/yesgraph-invites.js"], "dev/");
    return minify(["yesgraph.js","yesgraph-invites.js"], ".");
});

gulp.task("compileLess", function(){
    function compile(src, dest) {
        return gulp.src(src)
            .pipe(less())
            .pipe(rename({extname: ".css"}))
            .pipe(gulp.dest(dest))
    }
    compile("dev/yesgraph-invites.less", "dev/");
    return compile("yesgraph-invites.less", ".");
});

gulp.task("minifyCss", ["compileLess"], function(){
    function minify(src, dest) {
        return gulp.src(src)
            .pipe(cleanCSS())
            .pipe(rename({suffix: ".min"}))
            .pipe(gulp.dest(dest))
    }
    minify("dev/yesgraph-invites.css", "dev/")
    return minify("yesgraph-invites.css", ".")
});

gulp.task("watchLess", function(){
    var filesToWatch = ["dev/yesgraph-invites.less", "yesgraph-invites.less"];
    console.log("Watching Files: " + filesToWatch.join(", "));
    gulp.watch(filesToWatch, ["compileLess"]);
});

gulp.task("build", ["compileLess", "minifyCss", "minifyScripts"]);

gulp.task("default", ["build"]);
