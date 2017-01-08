//
// Import all of our test files into a single object
//
var tests = require("./specs/*.js", { hash: true });

//
// Define configurations for each set of tests to run
//
var configurations = [
    {
        tests: ['test_api', 'test_superwidget'],
        fixture: 'fixtures1.html.js'
    },
    {
        tests: ['test_api', 'test_superwidget'],
        fixture: 'fixtures2.html.js'
    },
];

//
// Run tests according to the configurations defined above
//
configurations.forEach(function (config) {
    config.tests.forEach(function (testName) {
        var runTests = tests[testName];
        runTests(config.fixture);
    });
});
