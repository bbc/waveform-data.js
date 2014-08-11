"use strict";

var audioContext = require('audio-context');
var WaveformData = require('../core.js');
WaveformData.adapters = require('../adapters');

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
function fromAudioObjectBuilder(raw_response, callback){
  var scale = 128;
  var scale_adjuster = 127; // to produce an 8bit like value

  /*
   * The result will vary on the codec implentation of the browser.
   * We don't handle the case where the browser is unable to handle the decoding.
   *
   * @see https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#dfn-decodeAudioData
   *
   * Adapted from BlockFile::CalcSummary in Audacity, with permission.
   * @see https://code.google.com/p/audacity/source/browse/audacity-src/trunk/src/BlockFile.cpp
   */
  audioContext.decodeAudioData(raw_response, function onAudioDecoded(audio_buffer){
    var data_length = Math.floor(audio_buffer.length / scale);
    var offset = 20;
    var data_object = new DataView(new ArrayBuffer(offset + data_length * 2));
    var left_channel, right_channel;
    var min_value = Infinity, max_value = -Infinity, scale_counter = scale;
    var buffer_length = audio_buffer.length;

    data_object.setInt32(0, 1, true);   //version
    data_object.setUint32(4, 1, true);   //is 8 bit
    data_object.setInt32(8, audio_buffer.sampleRate, true);   //sample rate
    data_object.setInt32(12, scale, true);   //scale
    data_object.setInt32(16, data_length, true);   //length

    left_channel = audio_buffer.getChannelData(0);
    right_channel = audio_buffer.getChannelData(0);

    for (var i = 0; i < buffer_length; i++){
      var sample = (left_channel[i] + right_channel[i]) / 2 * scale_adjuster;

      if (sample < min_value){
        min_value = sample;
      }

      if (sample > max_value){
        max_value = sample;
      }

      if (--scale_counter === 0){
        data_object.setInt8(offset++, Math.floor(min_value));
        data_object.setInt8(offset++, Math.floor(max_value));
        min_value = Infinity; max_value = -Infinity; scale_counter = scale;
      }
    }

    callback(new WaveformData(data_object.buffer, WaveformData.adapters.arraybuffer));
  });
}

fromAudioObjectBuilder.getAudioContext = function getAudioContext(){
  return audioContext;
};

module.exports = fromAudioObjectBuilder;