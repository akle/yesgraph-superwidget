var gulp = require("gulp");
var rename = require("gulp-rename");
var less = require("gulp-less");
var config = require("../config");

gulp.task("compile:less", function() {
    return gulp.src(config.tasks.compileLess.files, {base: config.src.root})
        .pipe(less())
        .pipe(rename({extname: ".css"}))
        .pipe(gulp.dest(config.src.root));
});
