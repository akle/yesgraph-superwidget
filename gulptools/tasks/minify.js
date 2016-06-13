var gulp = require("gulp");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var cleanCSS = require("gulp-clean-css");
var config = require("../config");

gulp.task("minifyScripts", function(){
    return gulp.src(config.tasks.minifyScripts.files, {base: config.src.root})
        .pipe(uglify({preserveComments: "license"}))
        .pipe(rename({suffix: ".min"}))
        .pipe(gulp.dest(config.src.root));
});

gulp.task("minifyCss", ["compileLess"], function(){
    return gulp.src(config.tasks.minifyCss.files, {base: config.src.root})
        .pipe(cleanCSS({keepSpecialComments: 1}))
        .pipe(rename({suffix: ".min"}))
        .pipe(gulp.dest(config.src.root));
});

gulp.task("minify", ["minifyScripts", "minifyCss"]);
