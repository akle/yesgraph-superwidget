var gulp = require("gulp");
var aws = require("gulp-awspublish");
var clone = require("gulp-clone")
var cloudfront = require('gulp-cloudfront-invalidate');
var rename = require("gulp-rename");
var sequence = require("run-sequence").use(gulp);

var config = require("../config");
var publisher = aws.create(config.s3);

gulp.task("deploy", function(done) {
    function startsWith (str, substr) {
        return str.slice(0,substr.length) === substr;
    }

    sequence("clean", "build", "version", function(){
        var cloneSink = clone.sink();
        gulp.src(config.tasks.deploy.files)
            // We use cloneSink here to create a copy of the files and rename
            // only the copies (so that they can be sorted by version in S3).
            .pipe(cloneSink)
            .pipe(rename(function(path){
                // Add versions to the filepath
                if (startsWith(path.basename, "yesgraph-invites") && path.extname == ".css") {
                    path.dirname += "/" + config.version.css;
                } else if (startsWith(path.basename, "yesgraph-invites") && path.extname == ".js") {
                    path.dirname += "/" + config.version.superwidget;
                } else if (startsWith(path.basename, "yesgraph") && path.extname == ".js") {
                    path.dirname += "/" + config.version.sdk;
                }
            }))
            // For every pipe after cloneSink.tap(), both the originals and
            // the clones are be used.
            .pipe(cloneSink.tap())
            .pipe(publisher.publish({}, {force: true}))
            .pipe(aws.reporter())
            .pipe(cloudfront(config.cloudfront))
            .on("end", done);
    });
});
