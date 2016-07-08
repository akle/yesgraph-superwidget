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
      'tests/*.html',
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

    browserStack: {
      username: process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_KEY
    },

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Which plugins to enable
    plugins: [
      'karma-browserstack-launcher',
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
    // browsers: ['Chrome'],
    browsers: ['Chrome', 'Firefox', 'Safari'],
    // browsers: ['bs_firefox_mac', 'bs_chrome_mac'],

    // you can define custom flags 
    customLaunchers: {
        Chrome_travis_ci: {
            base: 'Chrome',
            flags: ['--no-sandbox']
        },
        bs_firefox21_mac: {
            base: 'BrowserStack',
            browser: 'firefox',
            browser_version: '21.0',
            os: 'OS X',
            os_version: 'Mountain Lion',
        },
        bs_firefox47_mac: {
            base: 'BrowserStack',
            browser: 'firefox',
            browser_version: '47.0',
            os: 'OS X',
            os_version: 'Mountain Lion',
        },
        bs_chrome_mac: {
            base: 'BrowserStack',
            browser: 'chrome',
            browser_version: '53',
            os: 'OS X',
            os_version: 'Mountain Lion',
        },
        bs_iphone5: {
            base: 'BrowserStack',
            device: 'iPhone 5',
            os: 'ios',
            os_version: '6.0',
        },
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  });

    if (process.env.TRAVIS) {
        //config.browsers = ['Chrome_travis_ci', 'Firefox'];
        config.browsers = ['bs_firefox21_mac', 'bs_firefox47_mac', 'bs_chrome_mac'];
        config.reporters = ['progress', 'coverage', 'coveralls'];
    }
    else if (process.env.TRAVIS && process.env.TRAVIS_OS_NAME == "osx") {
    // http://swizec.com/blog/how-to-run-javascript-tests-in-chrome-on-travis/swizec/6647
        config.browsers = ['Chrome_travis_ci', 'Firefox', 'Safari'];
        config.reporters = ['progress', 'coverage', 'coveralls'];
    }
};
