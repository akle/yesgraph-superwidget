var root = ".";
var src = {
    dev: "./src/dev",
    root: "./src"
};
var dest = {
    dev: "./dist/dev",
    root: "./dist"
};
var __SDK_VERSION__ = "v0.0.3";
var __SUPERWIDGET_VERSION__ = "v0.0.3";
var __CSS_VERSION__ = "v0.0.4";

module.exports = {
    root: root,
    src: src,
    dest: dest,
    version: {
        sdk: __SDK_VERSION__,
        superwidget: __SUPERWIDGET_VERSION__,
        css: __CSS_VERSION__
    },
    tasks: {
        build: {
            files: [
                src.root + "/**/yesgraph-invites*css",
                src.root + "/**/yesgraph*js",
            ]
        },
        clean: {
            files: [
                root + "/jshint-report.txt",
                dest.root,
                src.root + "/**/*.css",
                src.root + "/**/*.min.*",
            ]
        },
        compileLess: {
            files: src.root + "/**/yesgraph-invites.less"
        },
        lint: {
            files: src.root + "/**/yesgraph*js",
            reportFile: root + "/jshint-report.txt"
        },
        minifyScripts: {
            files: src.root + "/**/yesgraph*js"
        },
        minifyCss: {
            files: src.root + "/**/yesgraph-invites.css"
        },
        watch: {
            files: src.root + "/**/yesgraph-invites.less"
        },
        version: {
            files: src.root + "/**/*"
        }
    }
}