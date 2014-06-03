"use strict";

/**
 * Points are an easy way to keep track bookmarks of the described audio file.
 *
 * They return values based on the actual offset. Which means if you change your offset and:
 *
 * * a point becomes **out of scope**, no data will be returned; 
 * * a point is **fully included in the offset**, its whole content will be returned.
 *
 * Points are created with the `WaveformData.set_point(timeStamp, name?)` method.
 *
 * @see WaveformData.prototype.set_point
 * @param {WaveformData} context WaveformData instance
 * @param {Integer} start Initial start index
 * @param {Integer} end Initial end index
 * @constructor
 */
var WaveformDataPoint = module.exports = function WaveformDataPoint(context, timeStamp){
  this.context = context;

  /**
   * Start index.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   * waveform.set_point(10, "example");
   *
   * console.log(waveform.points.example.timeStamp);  // -> 10
   *
   * waveform.offset(20, 50);
   * console.log(waveform.points.example.timeStamp);  // -> 10
   *
   * waveform.offset(70, 100);
   * console.log(waveform.points.example.timeStamp);  // -> 10
   * ```
   * @type {Integer} Time Stamp of the point
   */
  this.timeStamp = timeStamp;
};

/**
 * @namespace WaveformDataPoint
 */
WaveformDataPoint.prototype = {
  /**
   * Indicates if the point has some visible part in the actual WaveformData offset.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   * waveform.set_point(10, "example");
   *
   * console.log(waveform.points.example.visible);        // -> true
   *
   * waveform.offset(0, 50);
   * console.log(waveform.points.example.visible);        // -> true
   *
   * waveform.offset(70, 100);
   * console.log(waveform.points.example.visible);        // -> false
   * ```
   *
   * @return {Boolean} True if visible, false otherwise.
   */
  get visible(){
    return this.context.in_offset(this.timeStamp);
  }
};