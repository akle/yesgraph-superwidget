var gulp = require("gulp");

gulp.task("default", ["clean"], function(){
    return gulp.start("build");
});
