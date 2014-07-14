"use strict";

var WaveformDataSegment = require("./segment.js");
var WaveformDataPoint = require("./point.js");

/**
 * Facade to iterate on audio waveform response.
 *
 * ```javascript
 *  var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
 *
 *  var json_waveform = new WaveformData(xhr.responseText, WaveformData.adapters.object);
 *
 *  var arraybuff_waveform = new WaveformData(getArrayBufferData(), WaveformData.adapters.arraybuffer);
 * ```
 *
 * ## Offsets
 *
 * An **offset** is a non-destructive way to iterate on a subset of data.
 *
 * It is the easiest way to **navigate** through data without having to deal with complex calculations.
 * Simply iterate over the data to display them.
 *
 * *Notice*: the default offset is the entire set of data.
 *
 * @param {String|ArrayBuffer|Mixed} response_data Waveform data, to be consumed by the related adapter.
 * @param {WaveformData.adapter|Function} adapter Backend adapter used to manage access to the data.
 * @constructor
 */
var WaveformData = module.exports = function WaveformData(response_data, adapter){
  /**
   * Backend adapter used to manage access to the data.
   *
   * @type {Object}
   */
  this.adapter = adapter.fromResponseData(response_data);

  /**
   * Defined segments.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   *
   * console.log(waveform.segments.speakerA);          // -> undefined
   *
   * waveform.set_segment(30, 90, "speakerA");
   *
   * console.log(waveform.segments.speakerA.start);    // -> 30
   * ```
   *
   * @type {Object} A hash of `WaveformDataSegment` objects.
   */
  this.segments = {};

  /**
   * Defined points.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   *
   * console.log(waveform.points.speakerA);          // -> undefined
   *
   * waveform.set_point(30, "speakerA");
   *
   * console.log(waveform.points.speakerA.timeStamp);    // -> 30
   * ```
   *
   * @type {Object} A hash of `WaveformDataPoint` objects.
   */
  this.points = {};

  this.offset(0, this.adapter.length);
};

/**
 * Creates an instance of WaveformData by guessing the adapter from the data type.
 * As an icing sugar, it will also do the detection job from an XMLHttpRequest response.
 *
 * ```javascript
 * var xhr = new XMLHttpRequest();
 * xhr.open("GET", "http://example.com/waveforms/track.dat");
 * xhr.responseType = "arraybuffer";
 *
 * xhr.addEventListener("load", function onResponse(progressEvent){
 *   var waveform = WaveformData.create(progressEvent.target);
 *
 *   console.log(waveform.duration);
 * });
 *
 * xhr.send();
 * ```
 *
 * @static
 * @throws TypeError
 * @param {XMLHttpRequest|Mixed} data
 * @return {WaveformData}
 */
WaveformData.create = function createFromResponseData(data){
  var adapter = null;
  var xhrData = null;

  if (data && typeof data === "object" && ("responseText" in data || "response" in data)){
    xhrData = ("responseType" in data) ? data.response : (data.responseText || data.response);
  }

  Object.keys(WaveformData.adapters).some(function(adapter_id){
    if (WaveformData.adapters[adapter_id].isCompatible(xhrData || data)){
      adapter = WaveformData.adapters[adapter_id];
      return true;
    }
  });

  if (adapter === null){
    throw new TypeError("Could not detect a WaveformData adapter from the input.");
  }

  return new WaveformData(xhrData || data, adapter);
};

/**
 * Public API for the Waveform Data manager.
 *
 * @namespace WaveformData
 */
WaveformData.prototype = {
  /**
   * Clamp an offset of data upon the whole response body.
   * Pros: it's just a reference, not a new array. So it's fast.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.offset_length);   // -> 150
   * console.log(waveform.min[0]);          // -> -12
   *
   * waveform.offset(20, 50);
   *
   * console.log(waveform.min.length);      // -> 30
   * console.log(waveform.min[0]);          // -> -9
   * ```
   *
   * @param {Integer} start New beginning of the offset. (inclusive)
   * @param {Integer} end New ending of the offset (exclusive)
   */
  offset: function(start, end){
    var data_length = this.adapter.length;

    if (end < 0){
      throw new RangeError("End point must be non-negative [" + Number(end) + " < 0]");
    }

    if (end <= start){
      throw new RangeError("We can't end prior to the starting point [" + Number(end) + " <= " + Number(start) + "]");
    }

    if (start < 0){
      throw new RangeError("Start point must be non-negative [" + Number(start) + " < 0]");
    }

    if (start >= data_length){
      throw new RangeError("Start point must be within range [" + Number(start) + " >= " + data_length + "]");
    }

    if (end > data_length){
      end = data_length;
    }

    this.offset_start = start;
    this.offset_end = end;
    this.offset_length = end - start;
  },
  /**
   * Creates a new segment of data.
   * Pretty handy if you need to bookmark a duration and display it according to the current offset.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(Object.keys(waveform.segments));          // -> []
   *
   * waveform.set_segment(10, 120);
   * waveform.set_segment(30, 90, "speakerA");
   *
   * console.log(Object.keys(waveform.segments));          // -> ['default', 'speakerA']
   * console.log(waveform.segments.default.min.length);    // -> 110
   * console.log(waveform.segments.speakerA.min.length);   // -> 60
   * ```
   *
   * @param {Integer} start Beginning of the segment (inclusive)
   * @param {Integer} end Ending of the segment (exclusive)
   * @param {String*} identifier Unique identifier. If nothing is specified, *default* will be used as a value.
   * @return {WaveformDataSegment}
   */
  set_segment: function setSegment(start, end, identifier){
    identifier = identifier || "default";

    this.segments[identifier] = new WaveformDataSegment(this, start, end);

    return this.segments[identifier];
  },
  /**
   * Creates a new point of data.
   * Pretty handy if you need to bookmark a specific point and display it according to the current offset.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(Object.keys(waveform.points));          // -> []
   *
   * waveform.set_point(10);
   * waveform.set_point(30, "speakerA");
   *
   * console.log(Object.keys(waveform.points));          // -> ['default', 'speakerA']
   * ```
   *
   * @param {Integer} timeStamp the time to place the bookmark
   * @param {String*} identifier Unique identifier. If nothing is specified, *default* will be used as a value.
   * @return {WaveformDataPoint}
   */
  set_point: function setPoint(timeStamp, identifier){
    if(identifier === undefined || identifier === null || identifier.length === 0) {
      identifier = "default";
    }

    this.points[identifier] = new WaveformDataPoint(this, timeStamp);

    return this.points[identifier];
  },
  /**
   * Removes a point of data.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(Object.keys(waveform.points));          // -> []
   *
   * waveform.set_point(30, "speakerA");
   * console.log(Object.keys(waveform.points));          // -> ['speakerA']
   * waveform.remove_point("speakerA");
   * console.log(Object.keys(waveform.points));          // -> []
   * ```
   *
   * @param {String*} identifier Unique identifier. If nothing is specified, *default* will be used as a value.
   * @return null
   */
  remove_point: function removePoint(identifier) {
    if(this.points[identifier]) {
      delete this.points[identifier];
    }
  },
  /**
   * Creates a new WaveformData object with resampled data.
   * Returns a rescaled waveform, to either fit the waveform to a specific width, or to a specific zoom level.
   *
   * **Note**: You may specify either the *width* or the *scale*, but not both. The `scale` will be deduced from the `width` you want to fit the data into.
   *
   * Adapted from Sequence::GetWaveDisplay in Audacity, with permission.
   *
   * ```javascript
   * // ...
   * var waveform = WaveformData.create({ ... });
   *
   * // fitting the data in a 500px wide canvas
   * var resampled_waveform = waveform.resample({ width: 500 });
   *
   * console.log(resampled_waveform.min.length);   // -> 500
   *
   * // zooming out on a 3 times less precise scale
   * var resampled_waveform = waveform.resample({ scale: waveform.adapter.scale * 3 });
   *
   * // partial resampling (to perform fast animations involving a resampling per animation frame)
   * var partially_resampled_waveform = waveform.resample({ width: 500, from: 0, to: 500 });
   *
   * // ...
   * ```
   *
   * @see https://code.google.com/p/audacity/source/browse/audacity-src/trunk/src/Sequence.cpp
   * @param {Number|{width: Number, scale: Number}} options Either a constraint width or a constraint sample rate
   * @return {WaveformData} New resampled object
   */
  resample: function(options){
    if (typeof options === 'number'){
      options = {
        width: options
      };
    }

    options.input_index = typeof options.input_index === 'number' ? options.input_index : null;
    options.output_index = typeof options.output_index === 'number' ? options.output_index : null;
    options.scale = typeof options.scale === 'number' ? options.scale : null;
    options.width = typeof options.width === 'number' ? options.width : null;

    var is_partial_resampling = Boolean(options.input_index) || Boolean(options.output_index);

    if (options.input_index !== null && (options.input_index >= 0) === false){
      throw new RangeError('options.input_index should be a positive integer value. ['+ options.input_index +']');
    }

    if (options.output_index !== null && (options.output_index >= 0) === false){
      throw new RangeError('options.output_index should be a positive integer value. ['+ options.output_index +']');
    }

    if (options.width !== null && (options.width > 0) === false){
      throw new RangeError('options.width should be a strictly positive integer value. ['+ options.width +']');
    }

    if (options.scale !== null && (options.scale > 0) === false){
      throw new RangeError('options.scale should be a strictly positive integer value. ['+ options.scale +']');
    }

    if (!options.scale && !options.width){
      throw new RangeError('You should provide either a resampling scale or a width in pixel the data should fit in.');
    }

    var definedPartialOptionsCount = ['width', 'scale', 'output_index', 'input_index'].reduce(function(count, key){
      return count + (options[key] === null ? 0 : 1);
    }, 0);

    if (is_partial_resampling && definedPartialOptionsCount !== 4) {
      throw new Error('Some partial resampling options are missing. You provided ' + definedPartialOptionsCount + ' of them over 4.');
    }

    var output_data = [];
    var samples_per_pixel = options.scale || Math.floor(this.duration * this.adapter.sample_rate / options.width);    //scale we want to reach
    var scale = this.adapter.scale;   //scale we are coming from
    var channel_count = 2;

    var input_buffer_size = this.adapter.length; //the amount of data we want to resample i.e. final zoom want to resample all data but for intermediate zoom we want to resample subset
    var input_index = options.input_index || 0; //is this start point? or is this the index at current scale
    var output_index = options.output_index || 0; //is this end point? or is this the index at scale we want to be?
    var min = input_buffer_size ? this.min_sample(input_index) : 0; //min value for peak in waveform
    var max = input_buffer_size ? this.max_sample(input_index) : 0; //max value for peak in waveform
    var min_value = -128;
    var max_value = 127;

    if (samples_per_pixel < scale){
      throw new Error("Zoom level "+samples_per_pixel+" too low, minimum: "+scale);
    }

    var where, prev_where, stop, value, last_input_index;

    var sample_at_pixel = function sample_at_pixel(x){
      return Math.floor(x * samples_per_pixel);
    };

    var add_sample = function add_sample(min, max){
      output_data.push(min, max);
    };

    while (input_index < input_buffer_size) {
      while (Math.floor(sample_at_pixel(output_index) / scale) <= input_index){
        if (output_index){
          add_sample(min, max);
        }

        last_input_index = input_index;

        output_index++;

        where      = sample_at_pixel(output_index);
        prev_where = sample_at_pixel(output_index - 1);

        if (where !== prev_where){
          min = max_value;
          max = min_value;
        }
      }

      where = sample_at_pixel(output_index);
      stop = Math.floor(where / scale);

      if (stop > input_buffer_size){
        stop = input_buffer_size;
      }

      while (input_index < stop){
        value = this.min_sample(input_index);

        if (value < min){
          min = value;
        }

        value = this.max_sample(input_index);

        if (value > max){
          max = value;
        }

        input_index++;
      }

      if (is_partial_resampling && (output_data.length / channel_count) >= options.width) {
        break;
      }
    }

    if (is_partial_resampling) {
      if ((output_data.length / channel_count) > options.width && input_index !== last_input_index){
        add_sample(min, max);
      }
    }
    else if(input_index !== last_input_index){
      add_sample(min, max);
    }

    return new WaveformData({
      version: this.adapter.version,
      samples_per_pixel: samples_per_pixel,
      length: output_data.length / channel_count,
      data: output_data,
      sample_rate: this.adapter.sample_rate
    }, WaveformData.adapters.object);
  },
  /**
   * Returns all the min peaks values.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.min.length);      // -> 150
   * console.log(waveform.min[0]);          // -> -12
   *
   * waveform.offset(20, 50);
   *
   * console.log(waveform.min.length);      // -> 30
   * console.log(waveform.min[0]);          // -> -9
   * ```
   *
   * @api
   * @return {Array.<Integer>} Min values contained in the offset.
   */
  get min(){
    return this.offsetValues(this.offset_start, this.offset_length, 0);
  },
  /**
   * Returns all the max peaks values.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.max.length);      // -> 150
   * console.log(waveform.max[0]);          // -> 12
   *
   * waveform.offset(20, 50);
   *
   * console.log(waveform.max.length);      // -> 30
   * console.log(waveform.max[0]);          // -> 5
   * ```
   *
   * @api
   * @return {Array.<Integer>} Max values contained in the offset.
   */
  get max(){
    return this.offsetValues(this.offset_start, this.offset_length, 1);
  },
  /**
   * Return the unpacked values for a particular offset.
   *
   * @param {Integer} start
   * @param {Integer} length
   * @param {Integer} correction The step to skip for each iteration (as the response body is [min, max, min, max...])
   * @return {Array.<Integer>}
   */
  offsetValues: function getOffsetValues(start, length, correction){
    var adapter = this.adapter;
    var values = [];

    correction += (start * 2);  //offsetting the positioning query

    for (var i = 0; i < length; i++){
      values.push(adapter.at((i * 2) + correction));
    }

    return values;
  },
  /**
   * Compute the duration in seconds of the audio file.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   * console.log(waveform.duration);    // -> 10.33333333333
   *
   * waveform.offset(20, 50);
   * console.log(waveform.duration);    // -> 10.33333333333
   * ```
   *
   * @api
   * @return {number} Duration of the audio waveform, in seconds.
   */
  get duration(){
    return (this.adapter.length * this.adapter.scale) / this.adapter.sample_rate;
  },
  /**
   * Return the duration in seconds of the current offset.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.offset_duration);    // -> 10.33333333333
   *
   * waveform.offset(20, 50);
   *
   * console.log(waveform.offset_duration);    // -> 2.666666666667
   * ```
   *
   * @api
   * @return {number} Duration of the offset, in seconds.
   */
  get offset_duration(){
    return (this.offset_length * this.adapter.scale) / this.adapter.sample_rate;
  },
  /**
   * Return the number of pixels per second.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.pixels_per_second);       // -> 93.75
   * ```
   *
   * @api
   * @return {number} Number of pixels per second.
   */
  get pixels_per_second(){
    return this.adapter.sample_rate / this.adapter.scale;
  },
  /**
   * Return the amount of time represented by a single pixel.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.seconds_per_pixel);       // -> 0.010666666666666666
   * ```
   *
   * @return {number} Amount of time (in seconds) contained in a pixel.
   */
  get seconds_per_pixel(){
    return this.adapter.scale / this.adapter.sample_rate;
  },
  /**
   * Returns a value at a specific offset.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.at(20));              // -> -7
   * console.log(waveform.at(21));              // -> 12
   * ```
   *
   * @proxy
   * @param {Integer} index
   * @return {number} Offset value
   */
  at: function at_sample_proxy(index){
    return this.adapter.at(index);
  },
  /**
   * Return the pixel location for a certain time.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.at_time(0.0000000023));       // -> 10
   * ```
   * @param {number} time
   * @return {integer} Index location for a specific time.
   */
  at_time: function at_time(time){
    return Math.floor((time * this.adapter.sample_rate) / this.adapter.scale);
  },
  /**
   * Returns the time in seconds for a particular index
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.time(10));                    // -> 0.0000000023
   * ```
   *
   * @param {Integer} index
   * @return {number}
   */
  time: function time(index){
    return index * this.seconds_per_pixel;
  },
  /**
   * Return if a pixel lies within the current offset.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.in_offset(50));      // -> true
   * console.log(waveform.in_offset(120));     // -> true
   *
   * waveform.offset(100, 150);
   *
   * console.log(waveform.in_offset(50));      // -> false
   * console.log(waveform.in_offset(120));     // -> true
   * ```
   *
   * @param {number} pixel
   * @return {boolean} True if the pixel lies in the current offset, false otherwise.
   */
  in_offset: function isInOffset(pixel){
    return pixel >= this.offset_start && pixel < this.offset_end;
  },
  /**
   * Returns a min value for a specific offset.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.min_sample(10));      // -> -7
   * ```
   *
   * @param {Integer} offset
   * @return {Number} Offset min value
   */
  min_sample: function getMinValue(offset){
    return this.adapter.at(offset * 2);
  },
  /**
   * Returns a max value for a specific offset.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.max_sample(10));      // -> 12
   * ```
   *
   * @param {Integer} offset
   * @return {Number} Offset max value
   */
  max_sample: function getMaxValue(offset){
    return this.adapter.at((offset * 2) + 1);
  }
};

/**
 * Available adapters to manage the data backends.
 *
 * @type {Object}
 */
WaveformData.adapters = {};


/**
 * WaveformData Adapter Structure
 *
 * @typedef {{from: Number, to: Number, platforms: {}}}
 */
WaveformData.adapter = function WaveformDataAdapter(response_data){
  this.data = response_data;
};
