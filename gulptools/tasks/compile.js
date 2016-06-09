var gulp = require("gulp");
var rename = require("gulp-rename");
var less = require("gulp-less");
var config = require("../config");

gulp.task("compileLess", function(){
    function compile(src, dest) {
        return gulp.src(src)
            .pipe(less())
            .pipe(rename({extname: ".css"}))
            .pipe(gulp.dest(dest));
    }
    compile(config.tasks.compileLess.files.dev, config.src.dev);
    return compile(config.tasks.compileLess.files.root, config.src.root);
});