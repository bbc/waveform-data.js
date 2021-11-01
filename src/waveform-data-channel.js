/**
 * Provides access to the waveform data for a single audio channel.
 */

function WaveformDataChannel(waveformData, channelIndex) {
  this._waveformData = waveformData;
  this._channelIndex = channelIndex;
}

/**
 * Returns the waveform minimum at the given index position.
 */

WaveformDataChannel.prototype.min_sample = function(index) {
  var offset = (index * this._waveformData.channels + this._channelIndex) * 2;

  return this._waveformData._at(offset);
};

/**
 * Returns the waveform maximum at the given index position.
 */

WaveformDataChannel.prototype.max_sample = function(index) {
  var offset = (index * this._waveformData.channels + this._channelIndex) * 2 + 1;

  return this._waveformData._at(offset);
};

/**
 * Sets the waveform minimum at the given index position.
 */

WaveformDataChannel.prototype.set_min_sample = function(index, sample) {
  var offset = (index * this._waveformData.channels + this._channelIndex) * 2;

  return this._waveformData._set_at(offset, sample);
};

/**
 * Sets the waveform maximum at the given index position.
 */

WaveformDataChannel.prototype.set_max_sample = function(index, sample) {
  var offset = (index * this._waveformData.channels + this._channelIndex) * 2 + 1;

  return this._waveformData._set_at(offset, sample);
};

/**
 * Returns all the waveform minimum values as an array.
 */

WaveformDataChannel.prototype.min_array = function() {
  var length = this._waveformData.length;
  var values = [];

  for (var i = 0; i < length; i++) {
    values.push(this.min_sample(i));
  }

  return values;
};

/**
 * Returns all the waveform maximum values as an array.
 */

WaveformDataChannel.prototype.max_array = function() {
  var length = this._waveformData.length;
  var values = [];

  for (var i = 0; i < length; i++) {
    values.push(this.max_sample(i));
  }

  return values;
};

export default WaveformDataChannel;
