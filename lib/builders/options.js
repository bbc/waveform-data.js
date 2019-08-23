"use strict";

var defaultOptions = {
  scale: 512,
  amplitude_scale: 1.0,
  split_channels: false
};

function getOptions(options) {
  if (Object.prototype.hasOwnProperty.call(options, "scale_adjuster")) {
    throw new Error("Please rename the 'scale_adjuster' option to 'amplitude_scale'");
  }

  var opts = {
    scale: options.scale || defaultOptions.scale,
    amplitude_scale: options.amplitude_scale || defaultOptions.amplitude_scale,
    split_channels: options.split_channels || defaultOptions.split_channels
  };

  return opts;
}

module.exports = getOptions;
