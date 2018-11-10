"use strict";

var getAudioDecoder = require("./audiodecoder");

/**
 * Creates a working WaveformData based on binary audio data.
 *
 * This is still quite experimental and the result will mostly depend on the
 * level of browser support.
 *
 * ```javascript
 * const xhr = new XMLHttpRequest();
 * const audioContext = new AudioContext();
 *
 * // URL of a CORS MP3/Ogg file
 * xhr.open('GET', 'https://example.com/audio/track.ogg');
 * xhr.responseType = 'arraybuffer';
 *
 * xhr.addEventListener('load', function(progressEvent) {
 *   WaveformData.builders.webaudio(audioContext, progressEvent.target.response,
 *     function(err, waveform) {
 *     if (err) {
 *       console.error(err);
 *       return;
 *     }
 *
 *     console.log(waveform.duration);
 *   });
 * });
 *
 * xhr.send();
 * ```
 *
 * @todo use a Web Worker to offload processing of the binary data
 * @todo or use `SourceBuffer.appendBuffer` and `ProgressEvent` to stream the decoding
 * @todo abstract the number of channels, because it is assumed the audio file is stereo
 * @param {AudioContext|webkitAudioContext} audio_context
 * @param {ArrayBuffer} raw_response
 * @param {callback} what to do once the decoding is done
 * @constructor
 */

function fromAudioObjectBuilder(audio_context, raw_response, options, callback) {
  var audioContext = window.AudioContext || window.webkitAudioContext;
  var defaultOptions = {
    scale: 512,
    amplitude_scale: 1.0
  };

  if (!(audio_context instanceof audioContext)) {
    throw new TypeError("First argument should be an AudioContext instance");
  }

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

  return audio_context.decodeAudioData(
    raw_response,
    getAudioDecoder(options, callback),
    errorCallback
  );
}

module.exports = fromAudioObjectBuilder;
