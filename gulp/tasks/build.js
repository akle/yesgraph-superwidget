"use strict";
var gulp = require("gulp");
var config = require("../config");
var sequence = require("run-sequence").use(gulp);

gulp.task("build", ["clean"], function(done){
    sequence("compile:less", "version", "minify", function(){
    	done();
    });
});
