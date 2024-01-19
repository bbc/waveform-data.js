/**
 * AudioBuffer-based WaveformData generator
 *
 * Adapted from BlockFile::CalcSummary in Audacity, with permission.
 * See https://github.com/audacity/audacity/blob/
 *   1108c1376c09166162335fab4743008cba57c4ee/src/BlockFile.cpp#L198
 */

var INT8_MAX = 127;
var INT8_MIN = -128;

var INT16_MAX = 32767;
var INT16_MIN = -32768;

function calculateWaveformDataLength(audio_sample_count, scale) {
  var data_length = Math.floor(audio_sample_count / scale);

  var samples_remaining = audio_sample_count - (data_length * scale);

  if (samples_remaining > 0) {
    data_length++;
  }

  return data_length;
}

function generateWaveformData(options) {
  var scale = options.scale;
  var amplitude_scale = options.amplitude_scale;
  var split_channels = options.split_channels;
  var length = options.length;
  var sample_rate = options.sample_rate;
  var channels = options.channels.map(function(channel) {
    return new Float32Array(channel);
  });
  var output_channels = split_channels ? channels.length : 1;
  var header_size = 24;
  var data_length = calculateWaveformDataLength(length, scale);
  var bytes_per_sample = options.bits === 8 ? 1 : 2;
  var total_size = header_size + data_length * 2 * bytes_per_sample * output_channels;
  var buffer = new ArrayBuffer(total_size);
  var data_view = new DataView(buffer);

  var scale_counter = 0;
  var offset = header_size;
  var channel, i;

  var min_value = new Array(output_channels);
  var max_value = new Array(output_channels);

  for (channel = 0; channel < output_channels; channel++) {
    min_value[channel] = Infinity;
    max_value[channel] = -Infinity;
  }

  var range_min = options.bits === 8 ? INT8_MIN : INT16_MIN;
  var range_max = options.bits === 8 ? INT8_MAX : INT16_MAX;

  data_view.setInt32(0, 2, true); // Version
  data_view.setUint32(4, options.bits === 8, true); // Is 8 bit?
  data_view.setInt32(8, sample_rate, true); // Sample rate
  data_view.setInt32(12, scale, true); // Scale
  data_view.setInt32(16, data_length, true); // Length
  data_view.setInt32(20, output_channels, true);

  for (i = 0; i < length; i++) {
    var sample = 0;

    if (output_channels === 1) {
      for (channel = 0; channel < channels.length; ++channel) {
        sample += channels[channel][i];
      }

      sample = Math.floor(range_max * sample * amplitude_scale / channels.length);

      if (sample < min_value[0]) {
        min_value[0] = sample;

        if (min_value[0] < range_min) {
          min_value[0] = range_min;
        }
      }

      if (sample > max_value[0]) {
        max_value[0] = sample;

        if (max_value[0] > range_max) {
          max_value[0] = range_max;
        }
      }
    }
    else {
      for (channel = 0; channel < output_channels; ++channel) {
        sample = Math.floor(range_max * channels[channel][i] * amplitude_scale);

        if (sample < min_value[channel]) {
          min_value[channel] = sample;

          if (min_value[channel] < range_min) {
            min_value[channel] = range_min;
          }
        }

        if (sample > max_value[channel]) {
          max_value[channel] = sample;

          if (max_value[channel] > range_max) {
            max_value[channel] = range_max;
          }
        }
      }
    }

    if (++scale_counter === scale) {
      for (channel = 0; channel < output_channels; channel++) {
        if (options.bits === 8) {
          data_view.setInt8(offset++, min_value[channel]);
          data_view.setInt8(offset++, max_value[channel]);
        }
        else {
          data_view.setInt16(offset, min_value[channel], true);
          data_view.setInt16(offset + 2, max_value[channel], true);
          offset += 4;
        }

        min_value[channel] = Infinity;
        max_value[channel] = -Infinity;
      }

      scale_counter = 0;
    }
  }

  if (scale_counter > 0) {
    for (channel = 0; channel < output_channels; channel++) {
      if (options.bits === 8) {
        data_view.setInt8(offset++, min_value[channel]);
        data_view.setInt8(offset++, max_value[channel]);
      }
      else {
        data_view.setInt16(offset, min_value[channel], true);
        data_view.setInt16(offset + 2, max_value[channel], true);
      }
    }
  }

  return buffer;
}

export { generateWaveformData };
