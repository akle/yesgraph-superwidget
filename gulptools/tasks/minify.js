var gulp = require("gulp");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var cleanCSS = require("gulp-clean-css");
var config = require("../config");

gulp.task("minifyScripts", function(){
    function minify(src, dest) {
        return gulp.src(src)
            .pipe(uglify())
            .pipe(rename({suffix: ".min"}))
            .pipe(gulp.dest(dest));
    }
    minify(config.tasks.minifyScripts.files.dev, config.src.dev);
    return minify(config.tasks.minifyScripts.files.root, config.src.root);
});

gulp.task("minifyCss", ["compileLess"], function(){
    function minify(src, dest) {
        return gulp.src(src)
            .pipe(cleanCSS())
            .pipe(rename({suffix: ".min"}))
            .pipe(gulp.dest(dest));
    }
    minify(config.tasks.minifyCss.files.dev, config.src.dev);
    return minify(config.tasks.minifyCss.files.root, config.src.root);
});

gulp.task("minify", ["minifyScripts", "minifyCss"]);