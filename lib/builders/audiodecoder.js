'use strict';

var WaveformData = require('../../waveform-data.js');

/**
 * This callback is executed once the audio has been decoded by the browser and resampled by waveform-data.
 *
 * @callback onAudioResampled
 * @param {WaveformData} waveform_data Waveform instance of the browser decoded audio
 * @param {AudioBuffer} audio_buffer Decoded audio buffer
 */

/**
 * AudioBuffer-based WaveformData generator
 *
 * @param {Object.<{scale: Number, scale_adjuster: Number}>} options
 * @param {onAudioResampled} callback
 * @returns {Function.<AudioBuffer>}
 */
module.exports = function getAudioDecoder(options, callback){
  var scale = options.scale;
  var scale_adjuster = options.scale_adjuster;

  return function onAudioDecoded(audio_buffer){
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
        if (min_value < -128) {
          min_value = -128;
        }
      }

      if (sample > max_value){
        max_value = sample;
        if (max_value > 127) {
          max_value = 127;
        }
      }

      if (--scale_counter === 0){
        data_object.setInt8(offset++, Math.floor(min_value));
        data_object.setInt8(offset++, Math.floor(max_value));
        min_value = Infinity; max_value = -Infinity; scale_counter = scale;
      }
    }

    callback(
      null,
      new WaveformData(data_object.buffer, WaveformData.adapters.arraybuffer),
      audio_buffer
    );
  };
};
