"use strict";

/**
 * ArrayBuffer adapter consumes binary waveform data.
 */

function WaveformDataArrayBufferAdapter(buffer) {
  this._data = new DataView(buffer);
  this._offset = this.version === 2 ? 24 : 20;
}

/**
 * Detects if a set of data is suitable for the ArrayBuffer adapter.
 */

WaveformDataArrayBufferAdapter.isCompatible = function isCompatible(data) {
  var isCompatible = data && typeof data === "object" && "byteLength" in data;

  if (isCompatible) {
    var view = new DataView(data);
    var version = view.getInt32(0, true);

    if (version !== 1 && version !== 2) {
      throw new TypeError("This waveform data version not supported.");
    }
  }

  return isCompatible;
};

 WaveformDataArrayBufferAdapter.prototype = {

  /**
   * Returns the data format version number.
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
   */

  get sample_rate() {
    return this._data.getInt32(8, true);
  },

  /**
   * Returns the scale (number of samples per pixel).
   */

  get scale() {
    return this._data.getInt32(12, true);
  },

  /**
   * Returns the length of the waveform data (number of data points).
   */

  get length() {
    return this._data.getUint32(16, true);
  },

  /**
   * Returns a waveform data value at a specific offset.
   */

  at: function at_sample(index) {
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

  set_at: function set_at(index, sample) {
    if (this.bits === 8) {
      return this._data.setInt8(this._offset + index, sample);
    }
    else {
      return this._data.setInt16(this._offset + index * 2, sample, true);
    }
  },

  /**
   * Returns a new ArrayBuffer with the concatenated waveform.
   * All waveforms must have identical metadata (version, channels, etc)
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
