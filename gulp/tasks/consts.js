var gulp = require("gulp");
var gutil = require("gulp-util");
var argv = require("yargs").argv;
var replace = require("gulp-replace");
var debug = require("gulp-debug");
var config = require("../config");
var consts = config.tasks.consts.values;
var PROD_OR_DEV;

gulp.task("consts", function() {
    PROD_OR_DEV = isLocalBuild() ? "dev" : "prod";
    return gulp.src(config.tasks.consts.files, {base: config.src.root})
        .pipe(debug({ title: "consts" }))
        .pipe(replace(/__CONST_(\w*)__/g, constReplacer))
        .pipe(gulp.dest(config.dest.root));

});

function isLocalBuild() {
    return argv.local !== "false";
}

function constReplacer(match, target) {
    var result = consts[PROD_OR_DEV][target.toUpperCase()];
    return result;
}
