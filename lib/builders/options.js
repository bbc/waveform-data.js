"use strict";

var defaultOptions = {
  scale: 512,
  amplitude_scale: 1.0,
  split_channels: false,
  disable_worker: false
};

function getOptions(options) {
  var opts = {
    scale: options.scale || defaultOptions.scale,
    amplitude_scale: options.amplitude_scale || defaultOptions.amplitude_scale,
    split_channels: options.split_channels || defaultOptions.split_channels,
    disable_worker: options.disable_worker || defaultOptions.disable_worker
  };

  return opts;
}

module.exports = getOptions;
