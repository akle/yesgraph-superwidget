var gulp = require("gulp");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var cleanCSS = require("gulp-clean-css");
var sourcemaps = require("gulp-sourcemaps");
var config = require("../config");

gulp.task("minify:js", function() {
    return gulp.src(config.tasks.minifyScripts.files, {base: config.src.root})
        .pipe(sourcemaps.init())
        .pipe(uglify({preserveComments: "license"}))
        .pipe(rename({suffix: ".min"}))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest(config.dest.root));
});

gulp.task("minify:css", ["compile:less"], function() {
    return gulp.src(config.tasks.minifyCss.files, {base: config.dest.root})
        .pipe(cleanCSS({keepSpecialComments: 1}))
        .pipe(rename({suffix: ".min"}))
        .pipe(gulp.dest(config.dest.root));
});

gulp.task("minify", ["minify:js", "minify:css"]);
