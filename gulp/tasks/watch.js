var gulp = require("gulp");
var config = require("../config");

gulp.task("watch", function(){
    return gulp.watch(config.tasks.watch.files, ["compile:less"]);
});