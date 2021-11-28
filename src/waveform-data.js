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
    this._offset = this._version() >= 2 ? 24 : 20;

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

function WaveformResampler(options) {
  this._inputData = options.waveformData;

  this._startTime = options.startTime;
  this._endTime = options.endTime;

  if (options.scale) {
    this._output_samples_per_pixel = options.scale;
  }
  else {
    // Calculate the output scale (samples per pixel) from the given startTime,
    // endTime, and width (pixels)
    this._output_samples_per_pixel = (this._endTime - this._startTime)
                                   * this._inputData.sample_rate / options.width;
  }

  this._output_buffer_length_pixels = options.width;

  var output_header_size = 24; // version 2/3
  var bytes_per_sample = this._inputData.bits === 8 ? 1 : 2;
  var total_size = output_header_size
                 + this._output_buffer_length_pixels
                 * 2 * this._inputData.channels * bytes_per_sample;

  this._output_data = new ArrayBuffer(total_size);

  this.output_dataview = new DataView(this._output_data);

  this.output_dataview.setInt32(0, 3, true); // Version
  this.output_dataview.setUint32(4, this._inputData.bits === 8, true); // Is 8 bit?
  this.output_dataview.setInt32(8, this._inputData.sample_rate, true);
  this.output_dataview.setFloat32(12, this._output_samples_per_pixel, true);
  this.output_dataview.setInt32(16, this._output_buffer_length_pixels, true);
  this.output_dataview.setInt32(20, this._inputData.channels, true);

  this._outputWaveformData = new WaveformData(this._output_data);

  this._input_index = this._inputData.at_time(this._startTime);
  this._output_index = 0;

  this._channels = this._inputData.channels;

  this._min = new Array(this._channels);
  this._max = new Array(this._channels);

  var i;

  for (i = 0; i < this._channels; ++i) {
    if (this._input_buffer_size > 0) {
      this._min[i] = this._inputData.channel(i).min_sample(this._input_index);
      this._max[i] = this._inputData.channel(i).max_sample(this._input_index);
    }
    else {
      this._min[i] = 0;
      this._max[i] = 0;
    }
  }

  this._min_value = this._inputData.bits === 8 ? -128 : -32768;
  this._max_value = this._inputData.bits === 8 ?  127 :  32767;
}

WaveformResampler.prototype.sample_at_pixel = function(x) {
  return Math.floor(x * this._output_samples_per_pixel);
};

/**
 * Returns true when finished, or false if more to do
 */

WaveformResampler.prototype.next = function() {
  var count = 0;
  var total = 1000;
  var channel;
  var i;

  while (this._output_index < this._output_buffer_length_pixels && count < total) {
    var nextOutputTime = this._startTime
                       + (this._endTime - this._startTime)
                       * (this._output_index + 1) / this._output_buffer_length_pixels;

    var nextInputIndex = this._inputData.at_time(nextOutputTime);

    if (this._input_index === nextInputIndex) {
      for (i = 0; i < this._channels; ++i) {
        this._min[i] = this._getMinSample(i, this._input_index);
        this._max[i] = this._getMaxSample(i, this._input_index);
      }
    }
    else {
      while (this._input_index < nextInputIndex) {
        for (i = 0; i < this._channels; ++i) {
          let value = this._getMinSample(i, this._input_index);

          if (value < this._min[i]) {
            this._min[i] = value;
          }

          value = this._getMaxSample(i, this._input_index);

          if (value > this._max[i]) {
            this._max[i] = value;
          }
        }

        this._input_index++;
      }
    }

    for (i = 0; i < this._channels; ++i) {
      channel = this._outputWaveformData.channel(i);

      channel.set_min_sample(this._output_index, this._min[i]);
      channel.set_max_sample(this._output_index, this._max[i]);

      this._min[i] = this._max_value;
      this._max[i] = this._min_value;
    }

    this._output_index++;
    count++;
  }

  return this._output_index >= this._output_buffer_length_pixels;
};

WaveformResampler.prototype._getMinSample = function(channel, index) {
  channel = this._inputData.channel(channel);

  if (index >= this._inputData.length) {
    return 0;
  }

  return channel.min_sample(index);
};

WaveformResampler.prototype._getMaxSample = function(channel, index) {
  channel = this._inputData.channel(channel);

  if (index >= this._inputData.length) {
    return 0;
  }

  return channel.max_sample(index);
};

WaveformResampler.prototype.getOutputData = function() {
  return this._output_data;
};

WaveformData.prototype = {

  _getResampleOptions(options) {
    var opts = {};

    opts.scale = options.scale;
    opts.width = options.width;
    opts.startTime = options.startTime;
    opts.endTime = options.endTime;

    if (opts.width != null && (typeof opts.width !== "number" || opts.width <= 0)) {
      throw new RangeError("WaveformData.resample(): width should be a positive integer value");
    }

    if (opts.scale != null && (typeof opts.scale !== "number" || opts.scale <= 0)) {
      throw new RangeError("WaveformData.resample(): scale should be a positive integer value");
    }

    if (!opts.scale && !opts.width) {
      throw new Error("WaveformData.resample(): Missing scale or width option");
    }

    opts.startTime = 0.0;

    if (options.startTime) {
      if (!options.width) {
        throw new Error("WaveformData.resample(): width option is required with startTime");
      }

      if (options.startTime < 0.0) {
        throw new RangeError("WaveformData.resample(): startTime must not be negative");
      }

      opts.startTime = options.startTime;
    }

    opts.endTime = this.duration;

    if (options.endTime) {
      if (!options.width) {
        throw new Error("WaveformData.resample(): width option is required with startTime");
      }

      if (options.endTime < opts.startTime) {
        throw new RangeError("WaveformData.resample(): endTime must be greater than startTime");
      }

      // If endTime > duration, we'll pad the output with zeros to the specified width
      opts.endTime = options.endTime;
    }

    if (opts.scale) {
      opts.width = Math.floor(this.length * this.scale / opts.scale);
    }

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
    if (this._version() >= 2) {
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
    if (this._version() === 3) {
      return this._data.getFloat32(12, true);
    }
    else {
      return this._data.getInt32(12, true);
    }
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
