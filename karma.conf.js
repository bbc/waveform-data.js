"use strict";

// var path = require("path");

/* globals process */

module.exports = function(config) {
  var isCI = Boolean(process.env.CI);

  config.set({
    basePath: "",

    files: [
      { pattern: "lib/**/*.js", included: false, served: false, watched: true },
      "test/unit/**/*.js"
    ],

    frameworks: ["mocha", "browserify"],

    preprocessors: {
      "test/**/*.js": ["browserify"],
      "waveform-data.js": ["browserify"]
    },

    browserify: {
      debug: true,
      external: ["dist/waveform-data.min.js"],
      transform: [
        "brfs"
        // "browserify-istanbul"
      ]
    },

    reporters: ["spec"], // "coverage-istanbul"

    /* coverageIstanbulReporter: {
      reports: ["html", "lcovonly"],

      // Base output directory.
      dir: path.join(__dirname, "coverage"),

      // Combines coverage information from multiple browsers into one report
      // rather than outputting a report for each browser.
      combineBrowserReports: true,

      "report-config": {
        html: {
          // outputs the report in ./coverage/html
          subdir: "html"
        }
      }
    }, */

    port: 8080,
    runnerPort: 9100,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: !isCI,
    browsers: isCI ? ["Firefox"] : ["Chrome", "Safari", "Firefox"],
    captureTimeout: 5000,
    singleRun: true
  });
};
