"use strict";

/**
 * Object adapter consumes waveform data in JSON format.
 * It is used as a data abstraction layer by `WaveformData`.
 *
 * This is supposed to be a fallback for browsers not supporting ArrayBuffer:
 * * **Pros**: easy to debug and quite self describing.
 * * **Cons**: slower than ArrayBuffer, more memory consumption.
 *
 * @param {Object} data Waveform data object
 * @constructor
 */

function WaveformDataObjectAdapter(data) {
  this._data = data;
}

/**
 * Detects if a set of data is suitable for the Object adapter.
 * It is used internally by `WaveformData.create` so you should not bother using it.
 *
 * @static
 * @param {Mixed} data
 * @returns {boolean}
 */

WaveformDataObjectAdapter.isCompatible = function isCompatible(data) {
  return data &&
    typeof data === "object" &&
    "sample_rate" in data &&
    "samples_per_pixel" in data &&
    "bits" in data &&
    "length" in data &&
    "data" in data;
};

/**
 * @namespace WaveformDataObjectAdapter
 */

WaveformDataObjectAdapter.prototype = {
  /**
   * Returns the data format version number.
   *
   * @return {Integer} Version number of the consumed data format.
   */

  get version() {
    return this._data.version || 1;
  },

  /**
   * Returns the number of bits per sample, either 8 or 16.
   */

  get bits() {
    return this._data.bits;
  },

  /**
   * Returns the number of channels.
   *
   * @return {Integer} Number of channels.
   */

  get channels() {
    return this._data.channels || 1;
  },

  /**
   * Returns the number of samples per second.
   *
   * @return {Integer} Number of samples per second.
   */

  get sample_rate() {
    return this._data.sample_rate;
  },

  /**
   * Returns the scale (number of samples per pixel).
   *
   * @return {Integer} Number of samples per pixel.
   */

  get scale() {
    return this._data.samples_per_pixel;
  },

  /**
   * Returns the length of the waveform data (number of data points).
   *
   * @return {Integer} Length of the waveform data.
   */

  get length() {
    return this._data.length;
  },

  /**
   * Returns a value at a specific offset.
   *
   * @param {Integer} index
   * @return {number} waveform value
   */

  at: function at_sample(index) {
    const data = this._data.data;

    if (index >= 0 && index < data.length) {
      return data[index];
    }
    else {
      throw new RangeError("Invalid index: " + index);
    }
  },

  /**
   * Returns a new data object with the concatenated waveform.
   * Both waveforms must have identical metadata (version, channels, etc)
   *
   * @param {...WaveformDataObjectAdapter} otherAdapters One or more adapters
   * @return {Mixed} combined waveform data
   */

  concatBuffers: function() {
    var otherAdapters = Array.prototype.slice.call(arguments);
    var otherDatas = otherAdapters.map(function(a) {
      return a._data.data;
    });
    var result = Object.assign({}, this._data);

    result.data = result.data.concat.apply(result.data, otherDatas);
    result.length += otherAdapters.reduce(function(sum, adapter) {
      return sum + adapter.length;
    }, 0);
    return result;
  }
};

module.exports = WaveformDataObjectAdapter;
