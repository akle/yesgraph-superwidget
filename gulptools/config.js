var root = ".";
var src = {
    dev: "./src/dev",
    root: "./src"
};
var dest = {
    dev: "./dist/dev",
    root: "./dist"
};
var __SDK_VERSION__ = "v0.1.0";
var __SUPERWIDGET_VERSION__ = "v1.0.0";
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
            files: src.root + "/**/yesgraph?(-invites)?(.min).@(js|css)?(.map)"
        },
        clean: {
            files: [
                root + "/jshint-report.txt",
                src.root + "/**/*.@(css|min.*)",
                dest.root,
            ]
        },
        compileLess: {
            files: src.root + "/**/yesgraph-invites.less"
        },
        lint: {
            files: src.root + "/**/yesgraph?(-invites).js",
            reportFile: root + "/jshint-report.txt"
        },
        minifyScripts: {
            files: src.root + "/**/yesgraph?(-invites).js"
        },
        minifyCss: {
            files: src.root + "/**/yesgraph-invites.css"
        },
        watch: {
            files: src.root + "/**/yesgraph-invites.less"
        },
        version: {
            files: src.root + "/**/*"
        },
        update: {
            files: src.dev + "/yesgraph?(-invites)?(.min).@(js|less|css)"
        },
        deploy: {
            files: dest.root + "/**/yesgraph?(-invites)?(.min).@(js|css)?(.map)"
        }
    },
    s3: {
        region: "us-east-1",
        params: {
            Bucket: "code.yesgraph.com"
        }
    },
    cloudfront: {
        distribution: "E1QB3DF4HJE37H",
        paths: ["/yesgraph*"]
    }
}