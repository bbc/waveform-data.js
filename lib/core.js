"use strict";

var WaveformDataChannel = require("./channel");
var WaveformDataObjectAdapter = require("./adapters/object");
var WaveformDataArrayBufferAdapter = require("./adapters/arraybuffer");

var adapters = [
  WaveformDataArrayBufferAdapter,
  WaveformDataObjectAdapter
];

function getAdapter(data) {
  var Adapter = null;

  adapters.some(function(AdapterClass) {
    if (AdapterClass.isCompatible(data)) {
      Adapter = AdapterClass;
      return true;
    }
  });

  if (Adapter === null) {
    throw new TypeError(
      "WaveformData.create(): Could not detect a WaveformData adapter from the input"
    );
  }

  return Adapter;
}

/**
 * Provides access to waveform data.
 */

function WaveformData(options) {
  if (options.adapter) {
    this._adapter = options.adapter;
  }
  else {
    var Adapter = getAdapter(options.data);

    this._adapter = new Adapter(options.data);
  }

  this._channels = [];

  for (var channel = 0; channel < this.channels; channel++) {
    this._channels[channel] = new WaveformDataChannel(this, channel);
  }
}

/**
 * Creates and returns a WaveformData instance from the given waveform data.
 */

WaveformData.create = function create(data) {
  return new WaveformData({ data: data });
};

WaveformData.prototype = {

  /**
   * Creates and returns a new WaveformData object with resampled data.
   * Use this method to create waveform data at different zoom levels.
   *
   * Adapted from Sequence::GetWaveDisplay in Audacity, with permission.
   * https://code.google.com/p/audacity/source/browse/audacity-src/trunk/src/Sequence.cpp
   */

  resample: function(options) {
    options.scale = typeof options.scale === "number" ? options.scale : null;
    options.width = typeof options.width === "number" ? options.width : null;

    if (options.width != null && options.width <= 0) {
      throw new RangeError("WaveformData.resample(): width should be a positive integer value");
    }

    if (options.scale != null && options.scale <= 0) {
      throw new RangeError("WaveformData.resample(): scale should be a positive integer value");
    }

    if (!options.scale && !options.width) {
      throw new Error("WaveformData.resample(): Missing scale or width option");
    }

    // Scale we want to reach
    var output_samples_per_pixel = options.scale ||
      Math.floor(this.duration * this.sample_rate / options.width);
    var scale = this.scale; // scale we are coming from

    // The amount of data we want to resample i.e. final zoom want to resample
    // all data but for intermediate zoom we want to resample subset
    var input_buffer_size = this.length;

    var input_buffer_length_samples = input_buffer_size * this.scale;
    var output_buffer_length_samples =
      Math.ceil(input_buffer_length_samples / output_samples_per_pixel);

    var output_header_size = 24; // version 2
    var total_size = output_header_size + output_buffer_length_samples * 2 * this.channels;
    var output_data = new ArrayBuffer(total_size);
    var output_dataview = new DataView(output_data);

    output_dataview.setInt32(0, 2, true); // Version
    output_dataview.setUint32(4, this.bits === 8, true); // Is 8 bit?
    output_dataview.setInt32(8, this.sample_rate, true);
    output_dataview.setInt32(12, output_samples_per_pixel, true);
    output_dataview.setInt32(16, output_buffer_length_samples, true);
    output_dataview.setInt32(20, this.channels, true);

    var waveform_data = new WaveformData({
      adapter: new WaveformDataArrayBufferAdapter(output_data)
    });

    var input_index = 0;
    var output_index = 0;

    var channels = this.channels;

    var min = new Array(channels);
    var max = new Array(channels);

    var channel;

    for (channel = 0; channel < channels; ++channel) {
      if (input_buffer_size > 0) {
        min[channel] = this.channel(channel).min_sample(input_index);
        max[channel] = this.channel(channel).max_sample(input_index);
      }
      else {
        min[channel] = 0;
        max[channel] = 0;
      }
    }

    var min_value = -128;
    var max_value = 127;

    if (output_samples_per_pixel < scale) {
      throw new Error(
        "WaveformData.resample(): Zoom level " + output_samples_per_pixel +
        " too low, minimum: " + scale
      );
    }

    var where, prev_where, stop, value, last_input_index;

    function sample_at_pixel(x) {
      return Math.floor(x * output_samples_per_pixel);
    }

    while (input_index < input_buffer_size) {
      while (Math.floor(sample_at_pixel(output_index) / scale) === input_index) {
        if (output_index > 0) {
          for (channel = 0; channel < channels; ++channel) {
            waveform_data.channel(channel).set_min_sample(output_index - 1, min[channel]);
            waveform_data.channel(channel).set_max_sample(output_index - 1, max[channel]);
          }
        }

        last_input_index = input_index;

        output_index++;

        where      = sample_at_pixel(output_index);
        prev_where = sample_at_pixel(output_index - 1);

        if (where !== prev_where) {
          for (channel = 0; channel < channels; ++channel) {
            min[channel] = max_value;
            max[channel] = min_value;
          }
        }
      }

      where = sample_at_pixel(output_index);
      stop = Math.floor(where / scale);

      if (stop > input_buffer_size) {
        stop = input_buffer_size;
      }

      while (input_index < stop) {
        for (channel = 0; channel < channels; ++channel) {
          value = this.channel(channel).min_sample(input_index);

          if (value < min[channel]) {
            min[channel] = value;
          }

          value = this.channel(channel).max_sample(input_index);

          if (value > max[channel]) {
            max[channel] = value;
          }
        }

        input_index++;
      }
    }

    if (input_index !== last_input_index) {
      for (channel = 0; channel < channels; ++channel) {
        waveform_data.channel(channel).set_min_sample(output_index - 1, min[channel]);
        waveform_data.channel(channel).set_max_sample(output_index - 1, max[channel]);
      }
    }

    return waveform_data;
  },

  /**
   * Concatenates with one or more other waveforms, returning a new WaveformData object.
   */

  concat: function() {
    var self = this;
    var otherWaveforms = Array.prototype.slice.call(arguments);

    // Check that all the supplied waveforms are compatible
    otherWaveforms.forEach(function(otherWaveform) {
      if (self.channels !== otherWaveform.channels ||
        self.sample_rate !== otherWaveform.sample_rate ||
        self.scale !== otherWaveform.scale ||
        Object.getPrototypeOf(self._adapter) !== Object.getPrototypeOf(otherWaveform._adapter) ||
        self._adapter.version !== otherWaveform._adapter.version) {
        throw new Error("WaveformData.concat(): Waveforms are incompatible");
      }
    });

    var otherAdapters = otherWaveforms.map(function(w) {
      return w._adapter;
    });

    var combinedBuffer = this._adapter.concatBuffers.apply(this._adapter, otherAdapters);

    return WaveformData.create(combinedBuffer);
  },

  /**
   * Return the unpacked values for a particular offset.
   */

  _offsetValues: function getOffsetValues(start, length, correction) {
    var adapter = this._adapter;
    var values = [];
    var channels = this.channels;

    correction += (start * channels * 2); // offset the positioning query

    for (var i = 0; i < length; i++) {
      values.push(adapter.at((i * channels * 2) + correction));
    }

    return values;
  },

  /**
   * Returns the length of the waveform, in pixels.
   */

  get length() {
    return this._adapter.length;
  },

  /**
   * Returns the number of bits per sample, either 8 or 16.
   */

  get bits() {
    return this._adapter.bits;
  },

  /**
   * Returns the (approximate) duration of the audio file, in seconds.
   */

  get duration() {
    return this.length * this.scale / this.sample_rate;
  },

  /**
   * Returns the number of pixels per second.
   */

  get pixels_per_second() {
    return this.sample_rate / this.scale;
  },

  /**
   * Returns the amount of time represented by a single pixel, in seconds.
   */

  get seconds_per_pixel() {
    return this.scale / this.sample_rate;
  },

  /**
   * Returns the number of waveform channels.
   */

  get channels() {
    return this._adapter.channels;
  },

  /**
   * Returns a waveform channel.
   */

  channel: function(index) {
    if (index >= 0 && index < this._channels.length) {
      return this._channels[index];
    }
    else {
      throw new RangeError("Invalid channel: " + index);
    }
  },

  /**
   * Returns the number of audio samples per second.
   */

  get sample_rate() {
    return this._adapter.sample_rate;
  },

  /**
   * Returns the number of audio samples per pixel.
   */

  get scale() {
    return this._adapter.scale;
  },

  /**
   * Returns the waveform data index position for a given time.
   */

  at_time: function at_time(time) {
    return Math.floor(time * this.sample_rate / this.scale);
  },

  /**
   * Returns the time in seconds for a given index.
   */

  time: function time(index) {
    return index * this.scale / this.sample_rate;
  },

  /**
   * Returns an object containing the waveform data.
   */

  toJSON: function() {
    const waveform = {
      version: 2,
      channels: this.channels,
      sample_rate: this.sample_rate,
      samples_per_pixel: this.scale,
      bits: this.bits,
      length: this.length,
      data: []
    };

    for (var i = 0; i < this.length; i++) {
      for (var channel = 0; channel < this.channels; channel++) {
        waveform.data.push(this.channel(channel).min_sample(i));
        waveform.data.push(this.channel(channel).max_sample(i));
      }
    }

    return waveform;
  },

  /**
   * Returns the waveform data in binary format as an ArrayBuffer.
   */

  toArrayBuffer: function() {
    if (this._adapter instanceof WaveformDataArrayBufferAdapter) {
      return this._adapter._data.buffer;
    }
    else {
      var header_size = 24; // version 2
      var bytes_per_sample = this.bits === 8 ? 1 : 2;
      var total_size = header_size + this.length * 2 * this.channels * bytes_per_sample;
      var array_buffer = new ArrayBuffer(total_size);
      var data_object = new DataView(array_buffer);

      data_object.setInt32(0, 2, true); // Version
      data_object.setUint32(4, this.bits === 8, true);
      data_object.setInt32(8, this.sample_rate, true);
      data_object.setInt32(12, this.scale, true);
      data_object.setInt32(16, this.length, true);
      data_object.setInt32(20, this.channels, true);

      var index = header_size;

      var i, channel;

      if (this.bits === 8) {
        for (i = 0; i < this.length; i++) {
          for (channel = 0; channel < this.channels; channel++) {
            data_object.setInt8(index++, this.channel(channel).min_sample(i), true);
            data_object.setInt8(index++, this.channel(channel).max_sample(i), true);
          }
        }
      }
      else {
        for (i = 0; i < this.length; i++) {
          for (channel = 0; channel < this.channels; channel++) {
            data_object.setInt16(index, this.channel(channel).min_sample(i), true);
            data_object.setInt16(index + 2, this.channel(channel).max_sample(i), true);

            index += 4;
          }
        }
      }

      return array_buffer;
    }
  }
};

module.exports = WaveformData;
