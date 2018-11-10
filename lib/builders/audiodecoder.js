"use strict";

var WaveformData = require("../../waveform-data.js");
var InlineWorker = require("inline-worker");

/**
 * This callback is executed once the audio has been decoded by the browser and
 * resampled by waveform-data.
 *
 * @callback onAudioResampled
 * @param {WaveformData} waveform_data Waveform instance of the browser decoded audio
 * @param {AudioBuffer} audio_buffer Decoded audio buffer
 */

/**
 * AudioBuffer-based WaveformData generator
 *
 * Adapted from BlockFile::CalcSummary in Audacity, with permission.
 * @see https://code.google.com/p/audacity/source/browse/audacity-src/trunk/src/BlockFile.cpp
 *
 * @param {Object.<{scale: Number, amplitude_scale: Number}>} options
 * @param {onAudioResampled} callback
 * @returns {Function.<AudioBuffer>}
 */

function getAudioDecoder(options, callback) {
  return function onAudioDecoded(audio_buffer) {
    var worker = new InlineWorker(function() {
      var INT8_MAX = 127;
      var INT8_MIN = -128;

      function calculateWaveformDataLength(audio_sample_count, scale) {
        var data_length = Math.floor(audio_sample_count / scale);

        var samples_remaining = audio_sample_count - (data_length * scale);

        if (samples_remaining > 0) {
          data_length++;
        }

        return data_length;
      }

      this.addEventListener("message", function(evt) {
        var scale = evt.data.scale;
        var amplitude_scale = evt.data.amplitude_scale;
        var audio_buffer = evt.data.audio_buffer;

        var data_length = calculateWaveformDataLength(audio_buffer.length, scale);
        var header_size = 20;
        var data_object = new DataView(new ArrayBuffer(header_size + data_length * 2));
        var channels = audio_buffer.channels;
        var channel;
        var min_value = Infinity, max_value = -Infinity, scale_counter = 0;
        var buffer_length = audio_buffer.length;
        var offset = header_size;
        var i;

        data_object.setInt32(0, 1, true); // Version
        data_object.setUint32(4, 1, true); // Is 8 bit?
        data_object.setInt32(8, audio_buffer.sampleRate, true); // Sample rate
        data_object.setInt32(12, scale, true); // Scale
        data_object.setInt32(16, data_length, true); // Length

        for (i = 0; i < buffer_length; i++) {
          var sample = 0;

          for (channel = 0; channel < channels.length; ++channel) {
              sample += channels[channel][i];
          }

          sample = Math.floor(INT8_MAX * sample * amplitude_scale / channels.length);

          if (sample < min_value) {
            min_value = sample;

            if (min_value < INT8_MIN) {
              min_value = INT8_MIN;
            }
          }

          if (sample > max_value) {
            max_value = sample;

            if (max_value > INT8_MAX) {
              max_value = INT8_MAX;
            }
          }

          if (++scale_counter === scale) {
            data_object.setInt8(offset++, Math.floor(min_value));
            data_object.setInt8(offset++, Math.floor(max_value));
            min_value = Infinity; max_value = -Infinity; scale_counter = 0;
          }
        }

        if (scale_counter > 0) {
          data_object.setInt8(offset++, Math.floor(min_value));
          data_object.setInt8(offset++, Math.floor(max_value));
        }

        this.postMessage(data_object);
      });
    });

    worker.addEventListener("message", function(evt) {
      var data_object = evt.data;

      callback(
        null,
        new WaveformData(data_object.buffer, WaveformData.adapters.arraybuffer),
        audio_buffer
      );
    });

    // construct a simple object with the necessary AudioBuffer data,
    // as we cannot send an AudioBuffer to a Web Worker
    var audio_buffer_obj = {};

    audio_buffer_obj.length = audio_buffer.length;
    audio_buffer_obj.sampleRate = audio_buffer.sampleRate;
    audio_buffer_obj.channels = [];

    // fill in the channels data
    for (var channel = 0; channel < audio_buffer.numberOfChannels; ++channel) {
      audio_buffer_obj.channels[channel] = audio_buffer.getChannelData(channel);
    }

    worker.postMessage({
      "scale": options.scale,
      "amplitude_scale": options.amplitude_scale,
      "audio_buffer": audio_buffer_obj
    });
  };
}

module.exports = getAudioDecoder;
