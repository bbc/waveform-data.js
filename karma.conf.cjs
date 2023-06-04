"use strict";
/* eslint-env node */

var commonjs = require("@rollup/plugin-commonjs");
var resolve = require("@rollup/plugin-node-resolve").nodeResolve;
var babel = require("@rollup/plugin-babel");
var webWorkerLoader = require("@pyrologic/rollup-plugin-web-worker-loader");
var path = require("path");

module.exports = function(config) {
  config.set({
    basePath: "",

    frameworks: ["mocha", "chai-sinon"],

    client: {
      chai: {
        includeStack: true
      },
      mocha: {
        timeout: 10000
      }
    },

    files: [
      { pattern: "test/data/4channel.wav", included: false, served: true },
      { pattern: "test/unit/tests-browser.js", type: "module", included: true }
    ],

    preprocessors: {
      "test/unit/tests-browser.js": ["rollup"]
    },

    rollupPreprocessor: {
      plugins: [
        commonjs(),
        resolve({ browser: true }),
        webWorkerLoader(),
        babel.babel({
          babelHelpers: "bundled",
          exclude: "node_modules/**",
          plugins: ["istanbul"]
        })
      ],
      output: {
        format: "iife",
        name: "WaveformData",
        sourcemap: "inline"
      },
      onwarn: function(warning) {
        if (warning.code === "CIRCULAR_DEPENDENCY" &&
            warning.message.indexOf(path.normalize("node_modules/chai/lib") === 0)) {
          // Chai contains circular references, but they are not fatal and can be ignored.
          return;
        }
      }
    },

    customLaunchers: {
      FirefoxHeadless: {
        base: "Firefox",
        flags: ["-headless"]
      }
    },

    reporters: ["spec", "coverage"],

    coverageReporter: {
      reporters: [
        { type: "html", dir: "coverage", subdir: "." },
        { type: "text" },
        { type: "text-summary" }
      ]
    },

    port: 8080,
    runnerPort: 9100,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ["ChromeHeadless"],
    captureTimeout: 30000,
    singleRun: true
  });
};
