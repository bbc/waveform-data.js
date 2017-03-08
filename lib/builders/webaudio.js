"use strict";

var audioDecoder = require('./audiodecoder.js');

/**
 * Creates a working WaveformData based on binary audio data.
 *
 * This is still quite experimental and the result will mostly depend of the
 * support state of the running browser.
 *
 * ```javascript
 * var xhr = new XMLHttpRequest();
 * var audioContext = new AudioContext();
 *
 * // URL of a CORS MP3/Ogg file
 * xhr.open("GET", "http://example.com/audio/track.ogg");
 * xhr.responseType = "arraybuffer";
 *
 * xhr.addEventListener("load", function onResponse(progressEvent){
 *   WaveformData.builders.webaudio(audioContext, progressEvent.target.response, onProcessed(err, waveform){
 *     if (err) {
 *        console.error(err);
 *        return;
 *     }
 *
 *     console.log(waveform.duration);
 *   });
 * });
 *
 * xhr.send();
 *  ```
 *
 * @todo use a Web Worker to offload processing of the binary data
 * @todo or use `SourceBuffer.appendBuffer` and `ProgressEvent` to stream the decoding
 * @todo abstract the number of channels, because it is assumed the audio file is stereo
 * @param {AudioContext|webkitAudioContext} audio_context
 * @param {ArrayBuffer} raw_response
 * @param {callback} what to do once the decoding is done
 * @constructor
 */
function fromAudioObjectBuilder(audio_context, raw_response, options, callback){
  var audioContext = window.AudioContext || window.webkitAudioContext;
  var defaultOptions = {
    scale: 512,
    amplitude_scale: 1.0
  };

  if ((audio_context instanceof audioContext) === false) {
    throw new TypeError('First argument should be an instance of window.AudioContext');
  }

  // fromAudioObjectBuilder(audioContext, data, callback) form
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  else {
    options = options || {};
  }

  options.scale = options.scale || defaultOptions.scale;
  options.amplitude_scale = options.amplitude_scale || defaultOptions.amplitude_scale;

  if (options.hasOwnProperty('scale_adjuster')) {
    throw new Error("Please rename the 'scale_adjuster' option to 'amplitude_scale'");
  }

  /*
   * The result will vary on the codec implentation of the browser.
   * We don't handle the case where the browser is unable to handle the decoding.
   *
   * @see https://webaudio.github.io/web-audio-api/#widl-BaseAudioContext-createWaveShaper-WaveShaperNode
   *
   * Adapted from BlockFile::CalcSummary in Audacity, with permission.
   * @see https://code.google.com/p/audacity/source/browse/audacity-src/trunk/src/BlockFile.cpp
   */
  return audio_context.decodeAudioData(
    raw_response,
    audioDecoder(options, callback),
    callback
  );
}

module.exports = fromAudioObjectBuilder;
