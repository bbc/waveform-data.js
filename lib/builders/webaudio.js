"use strict";

var audioContext = require('audio-context');
var audioDecoder = require('./audiodecoder.js');

/**
 * Creates a working WaveformData based on binary audio data.
 *
 * This is still quite experimental and the result will mostly depend of the
 * support state of the running browser.
 *
 * ```javascript
 * var xhr = new XMLHttpRequest();
 *
 * // URL of a CORS MP3/Ogg file
 * xhr.open("GET", "http://example.com/audio/track.ogg");
 * xhr.responseType = "arraybuffer";
 *
 * xhr.addEventListener("load", function onResponse(progressEvent){
 *   WaveformData.builders.webaudio(progressEvent.target.response, onProcessed(waveform){
 *     console.log(waveform.duration);
 *   });
 * });
 *
 * xhr.send();
 *  ```
 *
 * @todo use the errorCallback for `decodeAudioData` to handle possible failures
 * @todo use a Web Worker to offload processing of the binary data
 * @todo or use `SourceBuffer.appendBuffer` and `ProgressEvent` to stream the decoding
 * @todo abstract the number of channels, because it is assumed the audio file is stereo
 * @param {ArrayBuffer} raw_response
 * @param {callback} what to do once the decoding is done
 * @constructor
 */
function fromAudioObjectBuilder(raw_response, options, callback){
  var defaultOptions = {
    scale: 512,
    scale_adjuster: 127
  };

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  else {
    options = options || {};
  }

  options.scale = options.scale || defaultOptions.scale;
  options.scale_adjuster = options.scale_adjuster || defaultOptions.scale_adjuster;

  /*
   * The result will vary on the codec implentation of the browser.
   * We don't handle the case where the browser is unable to handle the decoding.
   *
   * @see https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#dfn-decodeAudioData
   *
   * Adapted from BlockFile::CalcSummary in Audacity, with permission.
   * @see https://code.google.com/p/audacity/source/browse/audacity-src/trunk/src/BlockFile.cpp
   */
  audioContext.decodeAudioData(raw_response, audioDecoder(options, callback));
}

fromAudioObjectBuilder.getAudioContext = function getAudioContext(){
  return audioContext;
};

module.exports = fromAudioObjectBuilder;