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
    tasks: {
        build: {
            files: [
                src + "/**/yesgraph-invites*css",
                src + "/**/yesgraph*js",
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
            files: {
                dev: [
                    src.dev + "yesgraph-invites.less"
                ],
                root: [
                    src.root + "yesgraph-invites.less"
                ]
            }
        },
        lint: {
            files: [
                src.dev + "/yesgraph.js",
                src.dev + "/yesgraph-invites.js"
            ],
            reportFile: root + "/jshint-report.txt"
        },
        minifyScripts: {
            files: {
                dev: [
                    src.dev + "/yesgraph.js",
                    src.dev + "/yesgraph-invites.js"
                ],
                root: [
                    src.root + "/yesgraph.js",
                    src.root + "/yesgraph-invites.js"
                ]
            }
        },
        minifyCss: {
            files: {
                dev: [
                    src.dev + "yesgraph-invites.css"
                ],
                root: [
                    src.root + "yesgraph-invites.css"
                ]
            }
        },
        watch: {
            files: src.root + "/**/yesgraph-invites.less"
        },
        version: {
            files: src.root + "/**/*"
        }
    }
}