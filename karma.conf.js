module.exports = function(config){
  var isCI = Boolean(process.env.CI);

  config.set({
    basePath: '',
    files: [
      { pattern: 'lib/**/*.js', included: false, served: false, watched: true },
      'test/unit/**/*.js'
    ],
    exclude: [
      'test/unit/builders/webaudio.js'
    ],
    frameworks: ['mocha', 'browserify'],
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
    reporters: isCI ? 'dots' : 'progress',
    port: 8080,
    runnerPort: 9100,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: !isCI,
    browsers: isCI ? ['PhantomJS'] : ['Chrome', 'Safari', 'Firefox' ],
    captureTimeout: 5000,
    singleRun: isCI
  });
};
