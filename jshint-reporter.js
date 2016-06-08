"use strict";
var fs = require("fs");

module.exports = {
  reporter: function(issues, data, opts) {
    var errorCount = issues.length;
    var report = '';
    var summary = '';
    var prevfile;
    var settings = {
      outputFile: null
    };

    // Overwrite settings
    for (var opt in opts) {
      if (settings.hasOwnProperty(opt)) {
        settings[opt] = opts[opt];
      }
    }

    issues.forEach(function(issue) {
      var file = issue.file;
      var error = issue.error;

      if (prevfile && prevfile !== file) {
        report += "\n\n";
      }
      prevfile = file;

      report += file  + ': line ' + error.line + ', col ' +
        error.character + ', ' + error.reason;

      if (opts.verbose) {
        report += ' (' + error.code + ')';
      }

      report += '\n';
    });

    if (report) {
      summary = errorCount + " error" + ((errorCount === 1) ? "" : "s") + "\n";
      console.log(report);
      if (settings.outputFile) {
        fs.writeFile(settings.outputFile, report, function(err) {
          if (err) {
            console.error(err);
          }
        });
      }
    } else {
      summary = "No linting errors found. You go girl!";
    }
    console.log(summary);
  }
};