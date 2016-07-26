// Karma configuration
// Generated on Thu May 26 2016 11:06:20 GMT-0700 (PDT)
// https://www.sitepoint.com/testing-javascript-jasmine-travis-karma/

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine-jquery', 'jasmine', ],


    // list of files / patterns to load in the browser
    files: [
      'http://code.jquery.com/jquery-1.7.2.js',
      'tests/fixtures.html',
      'tests/*.js',
      'src/dev/yesgraph-invites.css', 
      'src/dev/yesgraph-invites.js', 
      'src/dev/yesgraph.js', 
      //'tests/*.js', 
      //'tests/*.html', 
    // Source and spec files
    // Fixtures

//    {
//      pattern: 'tests/*.html',
//      watched: false,
//      served: true,
//      included: false
//    }
      
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      '**/*.html': ['html2js'],
      'src/dev/*.js': ['coverage']
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],

    coverageReporter: {
        type: 'lcov', // lcov or lcovonly are required for generating lcov.info files
        dir: 'coverage/'
    },
    

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Which plugins to enable
    plugins: [
      'karma-phantomjs-launcher',
      'karma-jasmine-jquery',
      'karma-jasmine',
      'karma-coverage',
      'karma-chrome-launcher',
      'karma-html2js-preprocessor',
      'karma-firefox-launcher',
      'karma-safari-launcher',
      'karma-coveralls',
    ],

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],
    // browsers: ['Chrome', 'Firefox', 'Safari'],
    // browsers: ['PhantomJS', 'Chrome'],
    // browsers: ['PhantomJS'],

    // you can define custom flags 
    customLaunchers: {
        Chrome_travis_ci: {
            base: 'Chrome',
            flags: ['--no-sandbox']
        },
        'PhantomJS_custom': {
            base: 'PhantomJS',
            options: {
                windowName: 'window',
                content: '<div id="yesgraph" class="yesgraph-invites" data-testmode=true data-app="19185f1f-a583-4c6b-bc5f-8aff04dc1020" data-foo="bar"></div>',
                settings: {
                    webSecurityEnabled: false
                },
            },
            flags: ['--load-images=true'],
            debug: true
        }
    },
 
    phantomjsLauncher: {
      // Have phantomjs exit if a ResourceError is encountered (useful if karma exits without killing phantom) 
      exitOnResourceError: true
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  });

    if (process.env.TRAVIS && process.env.TRAVIS_OS_NAME == "osx") {
    // http://swizec.com/blog/how-to-run-javascript-tests-in-chrome-on-travis/swizec/6647
        config.browsers = ['Chrome_travis_ci', 'Firefox', 'Safari'];
    }
    else if (process.env.TRAVIS) {
        config.browsers = ['Chrome_travis_ci', 'Firefox'];
        config.reporters = ['progress', 'coverage'];
        
    }
};
