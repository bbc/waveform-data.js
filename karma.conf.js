module.exports = function(config){
  config.set({
    basePath: '',
    files: [
      'test/unit/*.js'
    ],
    frameworks: ['mocha', 'chai', 'browserify'],
    preprocessors: {
      'test/**/*.js': ['browserify'],
      'waveform-data.js': ['browserify']
    },
    browserify: {
      external: ['dist/waveform-data.min.js']
    },
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
