var gulp = require("gulp");
var clone = require("gulp-clone")
var rename = require("gulp-rename");
var sequence = require("run-sequence").use(gulp);
var config = require("../config");
var aws = require("gulp-awspublish");
var cloudfront = require('gulp-cloudfront-invalidate-aws-publish');
var publisher = aws.create(config.s3);

gulp.task("deploy", function(done) {
    sequence("clean", "build", function(){
        var cloneSink = clone.sink();
        gulp.src(config.tasks.deploy.files)
            .pipe(cloneSink)
            .pipe(rename(function(path){
                // Add versions to the filepath to organize in s3
                if (path.basename == "yesgraph-invites" && path.extname == ".css") {
                    path.dirname += "/" + config.version.css;
                } else if (path.basename == "yesgraph-invites" && path.extname == ".js") {
                    path.dirname += "/" + config.version.superwidget;
                } else if (path.basename == "yesgraph" && path.extname == ".js") {
                    path.dirname += "/" + config.version.sdk;
                }
            }))
            .pipe(cloneSink.tap())
            .pipe(rename(function(path) {
                path.dirname = "temp/" + path.dirname; // FIXME - temp for dev
            }))
            .pipe(publisher.publish({}, {force: true}))
            .pipe(aws.reporter())
            .pipe(cloudfront(config.cloudfront))
            .pipe(gulp.dest(config.root))
            .on("end", done);
    })
});
