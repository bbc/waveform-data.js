"use strict";

function getOptions(options, callback) {
  var defaultOptions = {
    scale: 512,
    amplitude_scale: 1.0
  };

  // fromAudioObjectBuilder(audioContext, data, callback) form
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  else {
    options = options || {};
  }

  options.scale = options.scale || defaultOptions.scale;
  options.amplitude_scale = options.amplitude_scale || defaultOptions.amplitude_scale;

  if (options.hasOwnProperty("scale_adjuster")) {
    throw new Error("Please rename the 'scale_adjuster' option to 'amplitude_scale'");
  }

  return {
    options: options,
    callback: callback
  };
}

module.exports = getOptions;
