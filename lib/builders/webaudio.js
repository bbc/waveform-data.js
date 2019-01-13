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
 *   WaveformData.createFromAudio(audioContext, progressEvent.target.response,
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
 * @todo Use `SourceBuffer.appendBuffer` and `ProgressEvent` to stream the decoding?
 * @param {AudioContext|webkitAudioContext} audio_context
 * @param {ArrayBuffer} audio_data
 * @param {callback} what to do once the decoding is done
 * @constructor
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
    throw new TypeError("Please pass either an AudioContext and ArrayBuffer, or an AudioBuffer object");
  }
}

module.exports = createFromAudio;
