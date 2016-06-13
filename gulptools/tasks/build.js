var gulp = require("gulp");
var config = require("../config");

gulp.task("_preBuild", ["minify"], function() {
    return gulp.start("version")
});

gulp.task("build", ["_preBuild"], function(){
    return gulp.src(config.tasks.build.files, {base: config.src.root})
        .pipe(gulp.dest(config.dest.root));
});
