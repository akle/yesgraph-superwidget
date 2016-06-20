var gulp = require("gulp");
var replace = require("gulp-replace");
var config = require("../config");

gulp.task("update", function() {
    return gulp.src(config.tasks.update.files)
        .pipe(replace(/dev\/(__\w*_VERSION__)/g, "$1")) // Strip "dev/" prefix
        .pipe(gulp.dest(config.src.root));
});
