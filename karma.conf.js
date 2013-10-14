module.exports = function(config){
  config.set({
    basePath: '',
    files: [
      'dist/waveform-data.tests.js'
    ],
    frameworks: ['mocha', 'chai'],
    plugins: [
      'karma-*'
    ],
    exclude: [],
    reporters: ['progress'],
    port: 8080,
    runnerPort: 9100,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: [
      'Chrome',
      'Safari',
      'Firefox'
    ],
    captureTimeout: 5000,
    singleRun: false
  });
};
