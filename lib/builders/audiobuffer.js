"use strict";

var getAudioDecoder = require("./audiodecoder");
var getOptions = require("./options");

function fromAudioBuffer(audioBuffer, options, callback) {
  var opts = getOptions(options, callback);

  return getAudioDecoder(opts.options, opts.callback)(audioBuffer);
}

module.exports = fromAudioBuffer;
