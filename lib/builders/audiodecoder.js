'use strict';

var WaveformData = require('../../waveform-data.js');

function calculateWaveformDataLength(audio_sample_count, scale) {
  var data_length = Math.floor(audio_sample_count / scale);

  var samples_remaining = audio_sample_count - (data_length * scale);

  if (samples_remaining > 0) {
    data_length++;
  }

  return data_length;
}

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
 * @param {Object.<{scale: Number, amplitude_scale: Number}>} options
 * @param {onAudioResampled} callback
 * @returns {Function.<AudioBuffer>}
 */
module.exports = function getAudioDecoder(options, callback){
  var scale = options.scale;
  var amplitude_scale = options.amplitude_scale;

  var INT8_MAX = 127;
  var INT8_MIN = -128;

  return function onAudioDecoded(audio_buffer) {
    var data_length = calculateWaveformDataLength(audio_buffer.length, scale);
    var header_size = 20;
    var data_object = new DataView(new ArrayBuffer(header_size + data_length * 2));
    var channels = [];
    var channel;
    var min_value = Infinity, max_value = -Infinity, scale_counter = 0;
    var buffer_length = audio_buffer.length;
    var offset = header_size;
    var i;

    data_object.setInt32(0, 1, true);   //version
    data_object.setUint32(4, 1, true);   //is 8 bit
    data_object.setInt32(8, audio_buffer.sampleRate, true);   //sample rate
    data_object.setInt32(12, scale, true);   //scale
    data_object.setInt32(16, data_length, true);   //length

    for (channel = 0; channel < audio_buffer.numberOfChannels; ++channel) {
      channels[channel] = audio_buffer.getChannelData(channel);
    }

    for (i = 0; i < buffer_length; i++){
      var sample = 0;

      for (channel = 0; channel < channels.length; ++channel) {
        sample += channels[channel][i];
      }

      sample = Math.floor(INT8_MAX * sample * amplitude_scale / channels.length);

      if (sample < min_value){
        min_value = sample;

        if (min_value < INT8_MIN) {
          min_value = INT8_MIN;
        }
      }

      if (sample > max_value){
        max_value = sample;

        if (max_value > INT8_MAX) {
          max_value = INT8_MAX;
        }
      }

      if (++scale_counter === scale){
        data_object.setInt8(offset++, Math.floor(min_value));
        data_object.setInt8(offset++, Math.floor(max_value));
        min_value = Infinity; max_value = -Infinity; scale_counter = 0;
      }
    }

    if (scale_counter > 0) {
        data_object.setInt8(offset++, Math.floor(min_value));
        data_object.setInt8(offset++, Math.floor(max_value));
    }

    callback(
      null,
      new WaveformData(data_object.buffer, WaveformData.adapters.arraybuffer),
      audio_buffer
    );
  };
};
