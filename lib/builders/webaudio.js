"use strict";

var getAudioDecoder = require("./audiodecoder");
var getOptions = require("./options");

function createFromArrayBuffer(audioContext, audioData, options, callback) {
  // The following function is a workaround for a Webkit bug where decodeAudioData
  // invokes the errorCallback with null instead of a DOMException.
  // See https://webaudio.github.io/web-audio-api/#dom-baseaudiocontext-decodeaudiodata
  // and http://stackoverflow.com/q/10365335/103396

  function errorCallback(error) {
    if (!error) {
      error = new DOMException("EncodingError");
    }

    callback(error);
  }

  audioContext.decodeAudioData(
    audioData,
    getAudioDecoder(options, callback),
    errorCallback
  );
}

function createFromAudioBuffer(audioBuffer, options, callback) {
  var audioDecoder = getAudioDecoder(options, callback);

  return audioDecoder(audioBuffer);
}

/**
 * Creates a WaveformData instance from audio.
 */

function createFromAudio(options, callback) {
  var opts = getOptions(options);

  if (options.audio_context && options.array_buffer) {
    return createFromArrayBuffer(options.audio_context, options.array_buffer, opts, callback);
  }
  else if (options.audio_buffer) {
    return createFromAudioBuffer(options.audio_buffer, opts, callback);
  }
  else {
    throw new TypeError(
      "WaveformData.createFromAudio(): Pass either an AudioContext and ArrayBuffer, or an AudioBuffer object"
    );
  }
}

module.exports = createFromAudio;
