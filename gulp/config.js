var root = ".";
var src = {
    dev: "./src/dev",
    root: "./src"
};
var dest = {
    dev: "./dist/dev",
    root: "./dist"
};
var __SDK_VERSION__ = "v0.2.0";
var __SUPERWIDGET_VERSION__ = "v1.2.1";
var __CSS_VERSION__ = "v0.0.6";

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
                root + '/deployed'
            ]
        },
        compileLess: {
            files: src.root + "/**/yesgraph-invites.less"
        },
        lint: {
            files: src.dev + "/**/yesgraph?(-invites).js",
            reportFile: root + "/jshint-report.txt",
            options: { // http://jshint.com/docs/options/
                esversion: 5,
                globals: {
                    "Clipboard": true,
                },
                browser: true,
                devel: true,
                jquery: true,
                maxdepth: 3,
                strict: true,
                undef: true,
                unused: true,
                eqnull: true,
            }
        },
        minifyScripts: {
            files: dest.root + "/**/yesgraph?(-invites).js"
        },
        minifyCss: {
            files: dest.root + "/**/yesgraph-invites.css"
        },
        watch: {
            files: {
                js: src.dev + "/**/*.js",
                less: src.dev + "/yesgraph-invites.less"
            }
        },
        version: {
            files: [
                src.root + "/**/yesgraph?(-invites)?(.min).js",
                dest.root + "/**/yesgraph-invites?(.min).css",
                root + "/package.json",
                root + "/gulp/config.js"
            ]
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
