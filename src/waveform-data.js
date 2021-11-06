import WaveformDataChannel from "./waveform-data-channel";
import { isJsonWaveformData, isBinaryWaveformData, convertJsonToBinary } from "./waveform-utils";

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

/**
 * Creates and returns a WaveformData instance from the given waveform data.
 */

WaveformData.create = function create(data) {
  return new WaveformData(data);
};

WaveformData.prototype = {

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
