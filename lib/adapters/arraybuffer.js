"use strict";

/**
 * ArrayBuffer adapter consumes binary waveform data.
 * It is used as a data abstraction layer by `WaveformData`.
 *
 * This is supposed to be the fastest adapter ever:
 * * **Pros**: working directly in memory, everything is done by reference
 *   (including the offsetting)
 * * **Cons**: binary data are hardly readable without data format knowledge
 *   (and this is why this adapter exists).
 *
 * @param {ArrayBuffer} buffer
 * @constructor
 */

function WaveformDataArrayBufferAdapter(buffer) {
  this._data = new DataView(buffer);
  this._offset = this.version === 2 ? 24 : 20;
}

/**
 * Detects if a set of data is suitable for the ArrayBuffer adapter.
 * It is used internally by `WaveformData.create` so you should not bother using it.
 *
 * @static
 * @param {Mixed} data
 * @returns {boolean}
 */

WaveformDataArrayBufferAdapter.isCompatible = function isCompatible(data) {
  const isCompatible = data && typeof data === "object" && "byteLength" in data;

  if (isCompatible) {
    const view = new DataView(data);
    const version = view.getInt32(0, true);

    if (version !== 1 && version !== 2) {
      throw new TypeError("This waveform data version not supported.");
    }
  }

  return isCompatible;
};

/**
 * @namespace WaveformDataArrayBufferAdapter
 */

 WaveformDataArrayBufferAdapter.prototype = {
  /**
   * Returns the data format version number.
   *
   * @return {Integer} Version number of the consumed data format.
   */

  get version() {
    return this._data.getInt32(0, true);
  },

  /**
   * Returns the number of bits per sample, either 8 or 16.
   */

  get bits() {
    var bits = Boolean(this._data.getUint32(4, true));

    return bits ? 8 : 16;
  },

  /**
   * Returns the number of channels.
   *
   * @return {Integer} Number of channels.
   */

  get channels() {
    if (this.version === 2) {
      return this._data.getInt32(20, true);
    }
    else {
      return 1;
    }
  },

  /**
   * Returns the number of samples per second.
   *
   * @return {Integer} Number of samples per second.
   */

  get sample_rate() {
    return this._data.getInt32(8, true);
  },

  /**
   * Returns the scale (number of samples per pixel).
   *
   * @return {Integer} Number of samples per pixel.
   */

  get scale() {
    return this._data.getInt32(12, true);
  },

  /**
   * Returns the length of the waveform data (number of data points).
   *
   * @return {Integer} Length of the waveform data.
   */

  get length() {
    return this._data.getUint32(16, true);
  },

  /**
   * Returns a value at a specific offset.
   *
   * @param {Integer} index
   * @return {Integer} waveform value
   */

  at: function at_sample(index) {
    return this._data.getInt8(this._offset + index);
  },

  /**
   * Returns a new ArrayBuffer with the concatenated waveform.
   * All waveforms must have identical metadata (version, channels, etc)
   *
   * @param {...WaveformDataArrayBufferAdapter} otherAdapters One or more adapters to concatenate
   * @return {ArrayBuffer} concatenated ArrayBuffer
   */

  concatBuffers: function() {
    var otherAdapters = Array.prototype.slice.call(arguments);
    var headerSize = this._offset;
    var totalSize = headerSize;
    var totalDataLength = 0;
    var bufferCollection = [this].concat(otherAdapters).map(function(w) {
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
  }
};

module.exports = WaveformDataArrayBufferAdapter;
