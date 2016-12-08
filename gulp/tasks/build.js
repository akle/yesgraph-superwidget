"use strict";
var gulp = require("gulp");
var sequence = require("run-sequence").use(gulp);

gulp.task("build", ["clean"], function(done){
    sequence("compile:less", "bundle", "consts", "version", "minify", done);
});
