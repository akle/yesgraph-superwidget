var gulp = require("gulp");
var exec = require("child_process").exec;

gulp.task("test", function(done) {
    exec("npm test", function(){
        done();
    });
});
