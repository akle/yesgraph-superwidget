var gulp = require("gulp");
var jshint = require('gulp-jshint');
var reporter = require('../jshint-reporter');
var config = require("../config");

gulp.task("lint", function(){
    return gulp.src(config.tasks.lint.files)
        .pipe(jshint())
        .pipe(jshint.reporter(reporter, {outputFile: config.tasks.lint.reportFile}))
        .pipe(jshint.reporter("fail"));
});