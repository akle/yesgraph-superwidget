var gulp = require("gulp");
var exec = require("child_process").exec;

gulp.task("test", function(done) {
    exec("npm test", function(error, output, stderr){
        if (error) {
            console.warn(error);
        }
        console.log(output);
        done();
    });
});
