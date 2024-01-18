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
  bits: 8,
  amplitude_scale: 1.0,
  split_channels: false,
  disable_worker: false
};

function getOptions(options) {
  var opts = {
    scale: options.scale || defaultOptions.scale,
    bits: options.bits || defaultOptions.bits,
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
      bits: options.bits,
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
      bits: options.bits,
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

function WaveformResampler(options) {
  this._inputData = options.waveformData;

  // Scale we want to reach
  this._output_samples_per_pixel = options.scale;

  this._scale = this._inputData.scale; // scale we are coming from

  // The amount of data we want to resample i.e. final zoom want to resample
  // all data but for intermediate zoom we want to resample subset
  this._input_buffer_size = this._inputData.length;

  var input_buffer_length_samples = this._input_buffer_size * this._inputData.scale;
  var output_buffer_length_samples =
    Math.ceil(input_buffer_length_samples / this._output_samples_per_pixel);

  var output_header_size = 24; // version 2
  var bytes_per_sample = this._inputData.bits === 8 ? 1 : 2;
  var total_size = output_header_size
                  + output_buffer_length_samples * 2 * this._inputData.channels * bytes_per_sample;

  this._output_data = new ArrayBuffer(total_size);

  this.output_dataview = new DataView(this._output_data);

  this.output_dataview.setInt32(0, 2, true); // Version
  this.output_dataview.setUint32(4, this._inputData.bits === 8, true); // Is 8 bit?
  this.output_dataview.setInt32(8, this._inputData.sample_rate, true);
  this.output_dataview.setInt32(12, this._output_samples_per_pixel, true);
  this.output_dataview.setInt32(16, output_buffer_length_samples, true);
  this.output_dataview.setInt32(20, this._inputData.channels, true);

  this._outputWaveformData = new WaveformData(this._output_data);

  this._input_index = 0;
  this._output_index = 0;

  var channels = this._inputData.channels;

  this._min = new Array(channels);
  this._max = new Array(channels);

  var channel;

  for (channel = 0; channel < channels; ++channel) {
    if (this._input_buffer_size > 0) {
      this._min[channel] = this._inputData.channel(channel).min_sample(this._input_index);
      this._max[channel] = this._inputData.channel(channel).max_sample(this._input_index);
    }
    else {
      this._min[channel] = 0;
      this._max[channel] = 0;
    }
  }

  this._min_value = this._inputData.bits === 8 ? -128 : -32768;
  this._max_value = this._inputData.bits === 8 ?  127 :  32767;

  this._where = 0;
  this._prev_where = 0;
  this._stop = 0;
  this._last_input_index = 0;
}

WaveformResampler.prototype.sample_at_pixel = function(x) {
  return Math.floor(x * this._output_samples_per_pixel);
};

WaveformResampler.prototype.next = function() {
  var count = 0;
  var total = 1000;
  var channels = this._inputData.channels;
  var channel;
  var value;
  var i;

  while (this._input_index < this._input_buffer_size && count < total) {
    while (Math.floor(this.sample_at_pixel(this._output_index) / this._scale) ===
           this._input_index) {
      if (this._output_index > 0) {
        for (i = 0; i < channels; ++i) {
          channel = this._outputWaveformData.channel(i);

          channel.set_min_sample(this._output_index - 1, this._min[i]);
          channel.set_max_sample(this._output_index - 1, this._max[i]);
        }
      }

      this._last_input_index = this._input_index;

      this._output_index++;

      this._where      = this.sample_at_pixel(this._output_index);
      this._prev_where = this.sample_at_pixel(this._output_index - 1);

      if (this._where !== this._prev_where) {
        for (i = 0; i < channels; ++i) {
          this._min[i] = this._max_value;
          this._max[i] = this._min_value;
        }
      }
    }

    this._where = this.sample_at_pixel(this._output_index);
    this._stop = Math.floor(this._where / this._scale);

    if (this._stop > this._input_buffer_size) {
      this._stop = this._input_buffer_size;
    }

    while (this._input_index < this._stop) {
      for (i = 0; i < channels; ++i) {
        channel = this._inputData.channel(i);

        value = channel.min_sample(this._input_index);

        if (value < this._min[i]) {
          this._min[i] = value;
        }

        value = channel.max_sample(this._input_index);

        if (value > this._max[i]) {
          this._max[i] = value;
        }
      }

      this._input_index++;
    }

    count++;
  }

  if (this._input_index < this._input_buffer_size) {
    // More to do
    return false;
  }
  else {
    // Done
    if (this._input_index !== this._last_input_index) {
      for (i = 0; i < channels; ++i) {
        channel = this._outputWaveformData.channel(i);

        channel.set_min_sample(this._output_index - 1, this._min[i]);
        channel.set_max_sample(this._output_index - 1, this._max[i]);
      }
    }

    return true;
  }
};

WaveformResampler.prototype.getOutputData = function() {
  return this._output_data;
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

    opts.abortSignal = options.abortSignal;

    return opts;
  },

  resample: function(options) {
    options = this._getResampleOptions(options);
    options.waveformData = this;

    var resampler = new WaveformResampler(options);

    while (!resampler.next()) {
      // nothing
    }

    return new WaveformData(resampler.getOutputData());
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

  slice: function(options) {
    var startIndex = 0;
    var endIndex = 0;

    if (options.startIndex != null && options.endIndex != null) {
      startIndex = options.startIndex;
      endIndex = options.endIndex;
    }
    else if (options.startTime != null && options.endTime != null) {
      startIndex = this.at_time(options.startTime);
      endIndex = this.at_time(options.endTime);
    }

    if (startIndex < 0) {
      throw new RangeError("startIndex or startTime must not be negative");
    }

    if (endIndex < 0) {
      throw new RangeError("endIndex or endTime must not be negative");
    }

    if (startIndex > this.length) {
      startIndex = this.length;
    }

    if (endIndex > this.length) {
      endIndex = this.length;
    }

    if (startIndex > endIndex) {
      startIndex = endIndex;
    }

    var length = endIndex - startIndex;

    var header_size = 24; // Version 2
    var bytes_per_sample = this.bits === 8 ? 1 : 2;
    var total_size = header_size
                   + length * 2 * this.channels * bytes_per_sample;

    var output_data = new ArrayBuffer(total_size);
    var output_dataview = new DataView(output_data);

    output_dataview.setInt32(0, 2, true); // Version
    output_dataview.setUint32(4, this.bits === 8, true); // Is 8 bit?
    output_dataview.setInt32(8, this.sample_rate, true);
    output_dataview.setInt32(12, this.scale, true);
    output_dataview.setInt32(16, length, true);
    output_dataview.setInt32(20, this.channels, true);

    for (var i = 0; i < length * this.channels * 2; i++) {
      var sample = this._at(startIndex * this.channels * 2 + i);

      if (this.bits === 8) {
        output_dataview.setInt8(header_size + i, sample);
      }
      else {
        output_dataview.setInt16(header_size + i * 2, sample, true);
      }
    }

    return new WaveformData(output_data);
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
