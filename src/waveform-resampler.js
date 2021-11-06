import WaveformData from "./waveform-data";

function WaveformResampler(waveformData, options) {
  this._inputData = waveformData;

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

export default WaveformResampler;
