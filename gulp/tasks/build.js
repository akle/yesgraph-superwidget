var gulp = require("gulp");
var config = require("../config");
var sequence = require("run-sequence").use(gulp);

gulp.task("build", ["clean"], function(done){
    sequence("version", "minify", function() {
        gulp.src(config.tasks.build.files, {base: config.src.root})
            .pipe(gulp.dest(config.dest.root))
            .on("end", done);
    });
});
