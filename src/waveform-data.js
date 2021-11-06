import WaveformDataChannel from "./waveform-data-channel";
import { generateWaveformData } from "./waveform-generator";
import { isJsonWaveformData, isBinaryWaveformData, convertJsonToBinary } from "./waveform-utils";
import WaveformDataWorker from "web-worker:./waveform-data-worker";

/**
 * Provides access to waveform data.
 */

function WaveformData(data) {
  if (isJsonWaveformData(data)) {
    data = convertJsonToBinary(data);
  }

  if (isBinaryWaveformData(data)) {
    this._data = new DataView(data);
    this._offset = this._version() === 2 ? 24 : 20;

    this._channels = [];

    for (var channel = 0; channel < this.channels; channel++) {
      this._channels[channel] = new WaveformDataChannel(this, channel);
    }
  }
  else {
    throw new TypeError(
      "WaveformData.create(): Unknown data format"
    );
  }
}

var defaultOptions = {
  scale: 512,
  amplitude_scale: 1.0,
  split_channels: false,
  disable_worker: false
};

function getOptions(options) {
  var opts = {
    scale: options.scale || defaultOptions.scale,
    amplitude_scale: options.amplitude_scale || defaultOptions.amplitude_scale,
    split_channels: options.split_channels || defaultOptions.split_channels,
    disable_worker: options.disable_worker || defaultOptions.disable_worker
  };

  return opts;
}

function getChannelData(audio_buffer) {
  var channels = [];

  for (var i = 0; i < audio_buffer.numberOfChannels; ++i) {
    channels.push(audio_buffer.getChannelData(i).buffer);
  }

  return channels;
}

function createFromAudioBuffer(audio_buffer, options, callback) {
  var channels = getChannelData(audio_buffer);

  if (options.disable_worker) {
    var buffer = generateWaveformData({
      scale: options.scale,
      amplitude_scale: options.amplitude_scale,
      split_channels: options.split_channels,
      length: audio_buffer.length,
      sample_rate: audio_buffer.sampleRate,
      channels: channels
    });

    callback(null, new WaveformData(buffer), audio_buffer);
  }
  else {
    var worker = new WaveformDataWorker();

    worker.onmessage = function(evt) {
      callback(null, new WaveformData(evt.data), audio_buffer);
    };

    worker.postMessage({
      scale: options.scale,
      amplitude_scale: options.amplitude_scale,
      split_channels: options.split_channels,
      length: audio_buffer.length,
      sample_rate: audio_buffer.sampleRate,
      channels: channels
    }, channels);
  }
}

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
    // prevent double-calling the callback on errors:
    callback = function() { };
  }

  var promise = audioContext.decodeAudioData(
    audioData,
    function(audio_buffer) {
      createFromAudioBuffer(audio_buffer, options, callback);
    },
    errorCallback
  );

  if (promise) {
    promise.catch(errorCallback);
  }
}

/**
 * Creates and returns a WaveformData instance from the given waveform data.
 */

WaveformData.create = function create(data) {
  return new WaveformData(data);
};

/**
 * Creates a WaveformData instance from audio.
 */

WaveformData.createFromAudio = function(options, callback) {
  var opts = getOptions(options);

  if (options.audio_context && options.array_buffer) {
    return createFromArrayBuffer(options.audio_context, options.array_buffer, opts, callback);
  }
  else if (options.audio_buffer) {
    return createFromAudioBuffer(options.audio_buffer, opts, callback);
  }
  else {
    throw new TypeError(
      // eslint-disable-next-line
      "WaveformData.createFromAudio(): Pass either an AudioContext and ArrayBuffer, or an AudioBuffer object"
    );
  }
};

WaveformData.prototype = {

  _getResampleOptions(options) {
    var opts = {};

    opts.scale = options.scale;
    opts.width = options.width;

    if (opts.width != null && (typeof opts.width !== "number" || opts.width <= 0)) {
      throw new RangeError("WaveformData.resample(): width should be a positive integer value");
    }

    if (opts.scale != null && (typeof opts.scale !== "number" || opts.scale <= 0)) {
      throw new RangeError("WaveformData.resample(): scale should be a positive integer value");
    }

    if (!opts.scale && !opts.width) {
      throw new Error("WaveformData.resample(): Missing scale or width option");
    }

    if (opts.width) {
      // Calculate the target scale for the resampled waveform
      opts.scale = Math.floor(this.duration * this.sample_rate / opts.width);
    }

    if (opts.scale < this.scale) {
      throw new Error(
        "WaveformData.resample(): Zoom level " + opts.scale +
        " too low, minimum: " + this.scale
      );
    }

    return opts;
  },

  /**
   * Creates and returns a new WaveformData object with resampled data.
   * Use this method to create waveform data at different zoom levels.
   *
   * Adapted from Sequence::GetWaveDisplay in Audacity, with permission.
   * https://code.google.com/p/audacity/source/browse/audacity-src/trunk/src/Sequence.cpp
   */

  resample: function(options) {
    options = this._getResampleOptions(options);

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
    var bytes_per_sample = this.bits === 8 ? 1 : 2;
    var total_size = output_header_size
                   + output_buffer_length_samples * 2 * this.channels * bytes_per_sample;
    var output_data = new ArrayBuffer(total_size);
    var output_dataview = new DataView(output_data);

    output_dataview.setInt32(0, 2, true); // Version
    output_dataview.setUint32(4, this.bits === 8, true); // Is 8 bit?
    output_dataview.setInt32(8, this.sample_rate, true);
    output_dataview.setInt32(12, output_samples_per_pixel, true);
    output_dataview.setInt32(16, output_buffer_length_samples, true);
    output_dataview.setInt32(20, this.channels, true);

    var waveform_data = new WaveformData(output_data);

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

    var min_value = this.bits === 8 ? -128 : -32768;
    var max_value = this.bits === 8 ?  127 :  32767;

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
        self.bits !== otherWaveform.bits ||
        self.scale !== otherWaveform.scale) {
        throw new Error("WaveformData.concat(): Waveforms are incompatible");
      }
    });

    var combinedBuffer = this._concatBuffers.apply(this, otherWaveforms);

    return WaveformData.create(combinedBuffer);
  },

  /**
   * Returns a new ArrayBuffer with the concatenated waveform.
   * All waveforms must have identical metadata (version, channels, etc)
   */

  _concatBuffers: function() {
    var otherWaveforms = Array.prototype.slice.call(arguments);
    var headerSize = this._offset;
    var totalSize = headerSize;
    var totalDataLength = 0;
    var bufferCollection = [this].concat(otherWaveforms).map(function(w) {
      return w._data.buffer;
    });
    var i, buffer;

    for (i = 0; i < bufferCollection.length; i++) {
      buffer = bufferCollection[i];
      var dataSize = new DataView(buffer).getInt32(16, true);

      totalSize += buffer.byteLength - headerSize;
      totalDataLength += dataSize;
    }

    var totalBuffer = new ArrayBuffer(totalSize);
    var sourceHeader = new DataView(bufferCollection[0]);
    var totalBufferView = new DataView(totalBuffer);

    // Copy the header from the first chunk
    for (i = 0; i < headerSize; i++) {
      totalBufferView.setUint8(i, sourceHeader.getUint8(i));
    }
    // Rewrite the data-length header item to reflect all of the samples concatenated together
    totalBufferView.setInt32(16, totalDataLength, true);

    var offset = 0;
    var dataOfTotalBuffer = new Uint8Array(totalBuffer, headerSize);

    for (i = 0; i < bufferCollection.length; i++) {
      buffer = bufferCollection[i];
      dataOfTotalBuffer.set(new Uint8Array(buffer, headerSize), offset);
      offset += buffer.byteLength - headerSize;
    }

    return totalBuffer;
  },

  /**
   * Returns the data format version number.
   */

  _version: function() {
    return this._data.getInt32(0, true);
  },

  /**
   * Returns the length of the waveform, in pixels.
   */

  get length() {
    return this._data.getUint32(16, true);
  },

  /**
   * Returns the number of bits per sample, either 8 or 16.
   */

  get bits() {
    var bits = Boolean(this._data.getUint32(4, true));

    return bits ? 8 : 16;
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
    if (this._version() === 2) {
      return this._data.getInt32(20, true);
    }
    else {
      return 1;
    }
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
    return this._data.getInt32(8, true);
  },

  /**
   * Returns the number of audio samples per pixel.
   */

  get scale() {
    return this._data.getInt32(12, true);
  },

  /**
   * Returns a waveform data value at a specific offset.
   */

  _at: function at_sample(index) {
    if (this.bits === 8) {
      return this._data.getInt8(this._offset + index);
    }
    else {
      return this._data.getInt16(this._offset + index * 2, true);
    }
  },

  /**
   * Sets a waveform data value at a specific offset.
   */

  _set_at: function set_at(index, sample) {
    if (this.bits === 8) {
      return this._data.setInt8(this._offset + index, sample);
    }
    else {
      return this._data.setInt16(this._offset + index * 2, sample, true);
    }
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
    return this._data.buffer;
  }
};

export default WaveformData;
