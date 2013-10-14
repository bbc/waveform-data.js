"use strict";

/**
 * Segments are an easy way to keep track of portions of the described audio file.
 *
 * They return values based on the actual offset. Which means if you change your offset and:
 *
 * * a segment becomes **out of scope**, no data will be returned;
 * * a segment is only **partially included in the offset**, only the visible parts will be returned;
 * * a segment is **fully included in the offset**, its whole content will be returned.
 *
 * Segments are created with the `WaveformData.set_segment(from, to, name?)` method.
 *
 * @see WaveformData.prototype.set_segment
 * @param {WaveformData} context WaveformData instance
 * @param {Integer} start Initial start index
 * @param {Integer} end Initial end index
 * @constructor
 */
var WaveformDataSegment = module.exports = function WaveformDataSegment(context, start, end){
  this.context = context;

  /**
   * Start index.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   * waveform.set_segment(10, 50, "example");
   *
   * console.log(waveform.segments.example.start);  // -> 10
   *
   * waveform.offset(20, 50);
   * console.log(waveform.segments.example.start);  // -> 10
   *
   * waveform.offset(70, 100);
   * console.log(waveform.segments.example.start);  // -> 10
   * ```
   * @type {Integer} Initial starting point of the segment.
   */
  this.start = start;

  /**
   * End index.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   * waveform.set_segment(10, 50, "example");
   *
   * console.log(waveform.segments.example.end);  // -> 50
   *
   * waveform.offset(20, 50);
   * console.log(waveform.segments.example.end);  // -> 50
   *
   * waveform.offset(70, 100);
   * console.log(waveform.segments.example.end);  // -> 50
   * ```
   * @type {Integer} Initial ending point of the segment.
   */
  this.end = end;
};

/**
 * @namespace WaveformDataSegment
 */
WaveformDataSegment.prototype = {
  /**
   * Dynamic starting point based on the WaveformData instance offset.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   * waveform.set_segment(10, 50, "example");
   *
   * console.log(waveform.segments.example.offset_start);  // -> 10
   *
   * waveform.offset(20, 50);
   * console.log(waveform.segments.example.offset_start);  // -> 20
   *
   * waveform.offset(70, 100);
   * console.log(waveform.segments.example.offset_start);  // -> null
   * ```
   *
   * @return {number} Starting point of the segment within the waveform offset. (inclusive)
   */
  get offset_start(){
    if (this.start < this.context.offset_start && this.end > this.context.offset_start){
      return this.context.offset_start;
    }

    if (this.start >= this.context.offset_start && this.start < this.context.offset_end){
      return this.start;
    }

    return null;
  },
  /**
   * Dynamic ending point based on the WaveformData instance offset.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   * waveform.set_segment(10, 50, "example");
   *
   * console.log(waveform.segments.example.offset_end);  // -> 50
   *
   * waveform.offset(20, 50);
   * console.log(waveform.segments.example.offset_end);  // -> 50
   *
   * waveform.offset(70, 100);
   * console.log(waveform.segments.example.offset_end);  // -> null
   * ```
   *
   * @return {number} Ending point of the segment within the waveform offset. (exclusive)
   */
  get offset_end(){
    if (this.end > this.context.offset_start && this.end <= this.context.offset_end){
      return this.end;
    }

    if (this.end > this.context.offset_end && this.start < this.context.offset_end){
      return this.context.offset_end;
    }

    return null;
  },
  /**
   * Dynamic segment length based on the WaveformData instance offset.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   * waveform.set_segment(10, 50, "example");
   *
   * console.log(waveform.segments.example.offset_length);  // -> 40
   *
   * waveform.offset(20, 50);
   * console.log(waveform.segments.example.offset_length);  // -> 30
   *
   * waveform.offset(70, 100);
   * console.log(waveform.segments.example.offset_length);  // -> 0
   * ```
   *
   * @return {number} Visible length of the segment within the waveform offset.
   */
  get offset_length(){
    return this.offset_end - this.offset_start;
  },
  /**
   * Initial length of the segment.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   * waveform.set_segment(10, 50, "example");
   *
   * console.log(waveform.segments.example.length);  // -> 40
   *
   * waveform.offset(20, 50);
   * console.log(waveform.segments.example.length);  // -> 40
   *
   * waveform.offset(70, 100);
   * console.log(waveform.segments.example.length);  // -> 40
   * ```
   *
   * @return {number} Initial length of the segment.
   */
  get length(){
    return this.end - this.start;
  },
  /**
   * Indicates if the segment has some visible part in the actual WaveformData offset.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   * waveform.set_segment(10, 50, "example");
   *
   * console.log(waveform.segments.example.visible);        // -> true
   *
   * waveform.offset(20, 50);
   * console.log(waveform.segments.example.visible);        // -> true
   *
   * waveform.offset(70, 100);
   * console.log(waveform.segments.example.visible);        // -> false
   * ```
   *
   * @return {Boolean} True if at least partly visible, false otherwise.
   */
  get visible(){
    return this.context.in_offset(this.start) || this.context.in_offset(this.end) || (this.context.offset_start > this.start && this.context.offset_start < this.end);
  },
  /**
   * Return the minimum values for the segment.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   * waveform.set_segment(10, 50, "example");
   *
   * console.log(waveform.segments.example.min.length);        // -> 40
   * console.log(waveform.segments.example.min.offset_length); // -> 40
   * console.log(waveform.segments.example.min[0]);            // -> -12
   *
   * waveform.offset(20, 50);
   *
   * console.log(waveform.segments.example.min.length);        // -> 40
   * console.log(waveform.segments.example.min.offset_length); // -> 30
   * console.log(waveform.segments.example.min[0]);            // -> -5
   * ```
   *
   * @return {Array.<Integer>} Min values of the segment.
   */
  get min(){
    return this.visible ? this.context.offsetValues(this.offset_start, this.offset_length, 0) : [];
  },
  /**
   * Return the maximum values for the segment.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   * waveform.set_segment(10, 50, "example");
   *
   * console.log(waveform.segments.example.max.length);        // -> 40
   * console.log(waveform.segments.example.max.offset_length); // -> 40
   * console.log(waveform.segments.example.max[0]);            // -> 5
   *
   * waveform.offset(20, 50);
   *
   * console.log(waveform.segments.example.max.length);        // -> 40
   * console.log(waveform.segments.example.max.offset_length); // -> 30
   * console.log(waveform.segments.example.max[0]);            // -> 11
   * ```
   *
   * @return {Array.<Integer>} Max values of the segment.
   */
  get max(){
    return this.visible ? this.context.offsetValues(this.offset_start, this.offset_length, 1) : [];
  }
};