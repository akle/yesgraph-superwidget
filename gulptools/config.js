var root = ".";
var src = {
    dev: "./src/dev",
    root: "./src"
};
var dest = {
    dev: "./dist/dev",
    root: "./dist"
};

module.exports = {
    root: root,
    src: src,
    dest: dest,
    version: {
        sdk: "v0.0.3",
        superwidget: "v0.0.3",
        css: "v0.0.4"
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