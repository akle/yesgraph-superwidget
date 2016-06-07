"use strict";

var gulp = require("gulp");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var less = require("gulp-less");
var cleanCSS = require('gulp-clean-css');
var jshint = require('gulp-jshint');
var reporter = require('./lint-reporter');
var del = require("del");

gulp.task('lint', function() {
  gulp.src('example.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(exitOnJshintError);
});
gulp.task("minifyScripts", function(){
    function minify(src, dest) {
        return gulp.src(src)
            .pipe(uglify())
            .pipe(rename({suffix: ".min"}))
            .pipe(gulp.dest(dest));
    }
    minify(["src/dev/yesgraph.js","src/dev/yesgraph-invites.js"], "src/dev/");
    return minify(["src/yesgraph.js","src/yesgraph-invites.js"], "src/");
});

gulp.task("compileLess", function(){
    function compile(src, dest) {
        return gulp.src(src)
            .pipe(less())
            .pipe(rename({extname: ".css"}))
            .pipe(gulp.dest(dest));
    }
    compile("src/dev/yesgraph-invites.less", "src/dev/");
    return compile("src/yesgraph-invites.less", "src/");
});

gulp.task("minifyCss", ["compileLess"], function(){
    function minify(src, dest) {
        return gulp.src(src)
            .pipe(cleanCSS())
            .pipe(rename({suffix: ".min"}))
            .pipe(gulp.dest(dest));
    }
    minify("src/dev/yesgraph-invites.css", "src/dev/");
    return minify("src/yesgraph-invites.css", "src/");
});

gulp.task("clean", function(){
    del(["dist/", "src/*.css", "src/dev/*.css", "src/*.min.*", "src/dev/*.min.*"]);
});

gulp.task("lint", function(){
    return gulp.src(["src/dev/yesgraph.js", "src/dev/yesgraph-invites.js"])
        .pipe(jshint())
        .pipe(jshint.reporter(reporter, {outputFile: "./lint-report.txt"}))
        .pipe(jshint.reporter("fail"));
});

gulp.task("build", ["compileLess", "minifyCss", "minifyScripts"], function(){
    return gulp.src([
            "src/dev/yesgraph-invites*css",
            "src/dev/yesgraph*js",
            "src/yesgraph-invites*css",
            "src/yesgraph*js"
        ], {base: "./src"})
        .pipe(gulp.dest("dist"));
});

gulp.task("watch", function(){
    gulp.watch(["src/dev/yesgraph-invites.less", "src/yesgraph-invites.less"], ["compileLess"]);
});

gulp.task("default", ["clean"], function(){
    gulp.start("build");
});
