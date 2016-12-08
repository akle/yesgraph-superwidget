var gulp = require("gulp");
var gutil = require("gulp-util");
var argv = require("yargs").argv;
var config = require("../config");
var replace = require("gulp-replace");
var debug = require("gulp-debug");

var PROD_OR_DEV;
var consts = {
    prod: {
        YESGRAPH_BASE_URL: "https://api.yesgraph.com",
        PUBLIC_RAVEN_DSN: "https://2f5e2b0beb494197b745f10f9fca6c9d@app.getsentry.com/79844",
        RUNNING_LOCALLY: false
    },
    dev: {
        YESGRAPH_BASE_URL: "http://localhost:5001",
        PUBLIC_RAVEN_DSN: "https://26657ee86c48458ea5c65e27de766715@app.getsentry.com/81078",
        RUNNING_LOCALLY: true
    }
}

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
