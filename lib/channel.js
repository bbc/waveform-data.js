"use strict";

/**
 * Provides access to the waveform data for a single audio channel.
 *
 * @param {WaveformData} waveformData Waveform data.
 * @param {Number} channelIndex Channel number.
 * @constructor
 */

function WaveformDataChannel(waveformData, channelIndex) {
  this._waveformData = waveformData;
  this._channelIndex = channelIndex;
}

/**
 * Returns a min value for a specific offset.
 *
 * ```javascript
 * var waveform = WaveformData.create({ ... });
 * var channel = waveform.channel(0);
 *
 * console.log(channel.min_sample(10)); // -> -12
 * ```
 *
 * @api
 * @param {Integer} offset
 * @return {Number} Offset min value
 */

WaveformDataChannel.prototype.min_sample = function(index) {
  const offset = (index * this._waveformData.channels + this._channelIndex) * 2;

  return this._waveformData._adapter.at(offset);
};

/**
 * Returns a max value for a specific offset.
 *
 * ```javascript
 * var waveform = WaveformData.create({ ... });
 * var channel = waveform.channel(0);
 *
 * console.log(channel.max_sample(10)); // -> 12
 * ```
 *
 * @api
 * @param {Integer} offset
 * @return {Number} Offset max value
 */

WaveformDataChannel.prototype.max_sample = function(index) {
  const offset = (index * this._waveformData.channels + this._channelIndex) * 2 + 1;

  return this._waveformData._adapter.at(offset);
};

/**
 * Returns all the min values within the current offset.
 *
 * ```javascript
 * var waveform = WaveformData.create({ ... });
 * var channel = waveform.channel(0);
 *
 * console.log(channel.min_array()); // -> [-7, -5, -10]
 * ```
 *
 * @return {Array.<Integer>} Min values contained in the offset.
 */

WaveformDataChannel.prototype.min_array = function() {
  return this._waveformData._offsetValues(
    0,
    this._waveformData.length,
    this._channelIndex * 2
  );
};

/**
 * Returns all the max values within the current offset.
 *
 * ```javascript
 * var waveform = WaveformData.create({ ... });
 * var channel = waveform.channel(0);
 *
 * console.log(channel.max_array()); // -> [9, 6, 11]
 * ```
 *
 * @return {Array.<Integer>} Max values contained in the offset.
 */

WaveformDataChannel.prototype.max_array = function() {
  return this._waveformData._offsetValues(
    0,
    this._waveformData.length,
    this._channelIndex * 2 + 1
  );
};

module.exports = WaveformDataChannel;
