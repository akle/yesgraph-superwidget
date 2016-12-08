var root = ".";
var src = {
    dev: "./src/dev",
    root: "./src"
};
var dest = {
    dev: "./dist/dev",
    root: "./dist"
};
var __SDK_VERSION__ = "v0.3.0";
var __SUPERWIDGET_VERSION__ = "v1.3.1";
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
        consts: {
            files: dest.root + "/**/yesgraph?(-invites)?(.min).js",
            values: {
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
        },
        lint: {
            files: src.dev + "/**/*.js",
            reportFile: root + "/jshint-report.txt",
            options: { // http://jshint.com/docs/options/
                esversion: 6, // babel converts this to ES5 in the `minify` task
                globals: {
                    "Clipboard": true,
                },
                browser: true,
                devel: true,
                jquery: true,
                maxdepth: 3,
                strict: "implied",
                undef: true,
                unused: true,
                eqnull: true,
            }
        },
        minify: {
            js: dest.root + "/**/yesgraph?(-invites).js",
            less: dest.root + "/**/yesgraph-invites.css"
        },
        bundle: [
            // Here we specify each filename individually, because the bundling tool
            // we use doesn't support gulp's built-in globbing syntax (e.g., src/**/*.js)
            // sdk: [src.root + "/sdk.js", src.dev + "/sdk.js"],
            // superwidget: [src.root + "/superwidget.js", src.dev + "/superwidget.js"],
            {
                input: src.root + "/sdk.js",
                output: "yesgraph.js",
                sourceMap: dest.root + "/yesgraph.js.map"
            },
            {
                input: src.dev + "/sdk.js",
                output: "dev/yesgraph.js",
                sourceMap: dest.dev + "/yesgraph.js.map"
            },
            {
                input: src.root + "/superwidget.js",
                output: "yesgraph-invites.js",
                sourceMap: dest.root + "/yesgraph-invites.js.map"
            },
            {
                input: src.dev + "/superwidget.js",
                output: "dev/yesgraph-invites.js",
                sourceMap: dest.dev + "/yesgraph-invites.js.map"
            }
        ],
        watch: {
            files: {
                js: src.dev + "/**/*.js",
                less: src.dev + "/yesgraph-invites.less"
            }
        },
        version: {
            files: [
                {
                    path: dest.root + "/yesgraph-invites?(.min).js",
                    type: "superwidget",
                    versionPrefix: ""
                },
                {
                    path: dest.dev + "/yesgraph-invites?(.min).js",
                    type: "superwidget",
                    versionPrefix: "dev/"
                },
                {
                    path: dest.root + "/yesgraph?(.min).js",
                    type: "sdk",
                    versionPrefix: ""
                },
                {
                    path: dest.dev + "/yesgraph?(.min).js",
                    type: "sdk",
                    versionPrefix: "dev/"
                },
                {
                    path: dest.root + "/yesgraph-invites?(.min).css",
                    type: "css",
                    versionPrefix: ""
                },
                {
                    path: dest.dev + "/yesgraph-invites?(.min).css",
                    type: "css",
                    versionPrefix: "dev/"
                },
                {
                    path: root + "/gulp/config.js",
                    type: "config",
                    versionPrefix: ""
                },
                {
                    path: root + "/package.json",
                    type: "package",
                    versionPrefix: ""
                }
            ],
        },
        update: {
            files: src.dev + "/**/*.@(js|less)"
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
