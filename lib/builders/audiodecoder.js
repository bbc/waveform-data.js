"use strict";

var WaveformData = require("../core");
var InlineWorker = require("inline-worker");

/**
 * This callback is executed once the audio has been decoded by the browser and
 * resampled by waveform-data.
 *
 * @callback onAudioResampled
 * @param {Error?}
 * @param {WaveformData} waveform_data Waveform instance of the browser decoded audio
 * @param {AudioBuffer} audio_buffer Decoded audio buffer
 */

/**
 * AudioBuffer-based WaveformData generator
 *
 * Adapted from BlockFile::CalcSummary in Audacity, with permission.
 * @see https://code.google.com/p/audacity/source/browse/audacity-src/trunk/src/BlockFile.cpp
 *
 * @param {Object.<{scale: Number, amplitude_scale: Number, split_channels: Boolean}>} options
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
        var split_channels = evt.data.split_channels;
        var audio_buffer = evt.data.audio_buffer;

        var channels = audio_buffer.channels;
        var output_channels = split_channels ? channels.length : 1;
        var version = output_channels === 1 ? 1 : 2;
        var header_size = version === 1 ? 20 : 24;
        var data_length = calculateWaveformDataLength(audio_buffer.length, scale);
        var total_size = header_size + data_length * 2 * output_channels;
        var data_object = new DataView(new ArrayBuffer(total_size));

        var min_value = new Array(output_channels);
        var max_value = new Array(output_channels);

        for (let channel = 0; channel < output_channels; channel++) {
          min_value[channel] = Infinity;
          max_value[channel] = -Infinity;
        }

        var scale_counter = 0;
        var buffer_length = audio_buffer.length;
        var offset = header_size;
        var channel, i;

        data_object.setInt32(0, version, true); // Version
        data_object.setUint32(4, 1, true); // Is 8 bit?
        data_object.setInt32(8, audio_buffer.sampleRate, true); // Sample rate
        data_object.setInt32(12, scale, true); // Scale
        data_object.setInt32(16, data_length, true); // Length

        if (version === 2) {
          data_object.setInt32(20, output_channels, true);
        }

        for (i = 0; i < buffer_length; i++) {
          var sample = 0;

          if (output_channels === 1) {
            for (channel = 0; channel < channels.length; ++channel) {
              sample += channels[channel][i];
            }

            sample = Math.floor(INT8_MAX * sample * amplitude_scale / channels.length);

            if (sample < min_value[0]) {
              min_value[0] = sample;

              if (min_value[0] < INT8_MIN) {
                min_value[0] = INT8_MIN;
              }
            }

            if (sample > max_value[0]) {
              max_value[0] = sample;

              if (max_value[0] > INT8_MAX) {
                max_value[0] = INT8_MAX;
              }
            }
          }
          else {
            for (channel = 0; channel < output_channels; ++channel) {
              sample = Math.floor(INT8_MAX * channels[channel][i] * amplitude_scale);

              if (sample < min_value[channel]) {
                min_value[channel] = sample;

                if (min_value[channel] < INT8_MIN) {
                  min_value[channel] = INT8_MIN;
                }
              }

              if (sample > max_value[channel]) {
                max_value[channel] = sample;

                if (max_value[channel] > INT8_MAX) {
                  max_value[channel] = INT8_MAX;
                }
              }
            }
          }

          if (++scale_counter === scale) {
            for (channel = 0; channel < output_channels; channel++) {
              data_object.setInt8(offset++, min_value[channel]);
              data_object.setInt8(offset++, max_value[channel]);

              min_value[channel] = Infinity;
              max_value[channel] = -Infinity;
            }

            scale_counter = 0;
          }
        }

        if (scale_counter > 0) {
          for (channel = 0; channel < output_channels; channel++) {
            data_object.setInt8(offset++, min_value[channel]);
            data_object.setInt8(offset++, max_value[channel]);
          }
        }

        this.postMessage(data_object);
      });
    });

    worker.addEventListener("message", function(evt) {
      var data_object = evt.data;

      callback(
        null,
        new WaveformData(data_object.buffer),
        audio_buffer
      );
    });

    // Construct a simple object with the necessary AudioBuffer data,
    // as we cannot send an AudioBuffer to a Web Worker.
    var audio_buffer_obj = {
      length: audio_buffer.length,
      sampleRate: audio_buffer.sampleRate,
      channels: []
    };

    // Fill in the channels data.
    for (var channel = 0; channel < audio_buffer.numberOfChannels; ++channel) {
      audio_buffer_obj.channels[channel] = audio_buffer.getChannelData(channel);
    }

    worker.postMessage({
      scale: options.scale,
      amplitude_scale: options.amplitude_scale,
      split_channels: options.split_channels,
      audio_buffer: audio_buffer_obj
    });
  };
}

module.exports = getAudioDecoder;
