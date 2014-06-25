# WaveformData

<table>
  <tr>
    <th><code>response_data</code></th>
    <td><code>String</code> | <code>ArrayBuffer</code> | <code>Mixed</code></td>
    <td>Waveform data, to be consumed by the related adapter.</td>
  </tr><tr>
    <th><code>adapter</code></th>
    <td><code>WaveformData.adapter</code> | <code>Function</code></td>
    <td>Backend adapter used to manage access to the data.</td>
  </tr>
</table>

* `@constructor`


> Facade to iterate on audio waveform response.

```javascript
 var waveform = new WaveformData({ ... }, WaveformData.adapters.object);

 var json_waveform = new WaveformData(xhr.responseText, WaveformData.adapters.object);

 var arraybuff_waveform = new WaveformData(getArrayBufferData(), WaveformData.adapters.arraybuffer);
```

## Offsets

An **offset** is a non-destructive way to iterate on a subset of data.

It is the easiest way to **navigate** through data without having to deal with complex calculations.
Simply iterate over the data to display them.

*Notice*: the default offset is the entire set of data.

# this.adapter


* `@type` `Object` 


> Backend adapter used to manage access to the data.

# this.segments


* `@type` `Object` 


> Defined segments.

```javascript
var waveform = new WaveformData({ ... }, WaveformData.adapters.object);

console.log(waveform.segments.speakerA);          // -> undefined

waveform.set_segment(30, 90, "speakerA");

console.log(waveform.segments.speakerA.start);    // -> 30
```

# this.points


* `@type` `Object` 


> Defined points.

```javascript
var waveform = new WaveformData({ ... }, WaveformData.adapters.object);

console.log(waveform.points.speakerA);          // -> undefined

waveform.set_point(30, "speakerA");

console.log(waveform.points.speakerA.timeStamp);    // -> 30
```

# WaveformData.create()

<table>
  <tr>
    <th><code>data</code></th>
    <td><code>XMLHttpRequest</code> | <code>Mixed</code></td>
    <td></td>
  </tr>
</table>

* `@static`
* `@throws` `TypeError` 
* `@return` `WaveformData` 


> Creates an instance of WaveformData by guessing the adapter from the data type.
As an icing sugar, it will also do the detection job from an XMLHttpRequest response.

```javascript
var xhr = new XMLHttpRequest();
xhr.open("GET", "http://example.com/waveforms/track.dat");
xhr.responseType = "arraybuffer";

xhr.addEventListener("load", function onResponse(progressEvent){
  var waveform = WaveformData.create(progressEvent.target);

  console.log(waveform.duration);
});

xhr.send();
```

# WaveformData.prototype.offset()

<table>
  <tr>
    <th><code>start</code></th>
    <td><code>Integer</code></td>
    <td>New beginning of the offset. (inclusive)</td>
  </tr><tr>
    <th><code>end</code></th>
    <td><code>Integer</code></td>
    <td>New ending of the offset (exclusive)</td>
  </tr>
</table>



> Clamp an offset of data upon the whole response body.
Pros: it's just a reference, not a new array. So it's fast.

```javascript
var waveform = WaveformData.create({ ... });

console.log(waveform.offset_length);   // -> 150
console.log(waveform.min[0]);          // -> -12

waveform.offset(20, 50);

console.log(waveform.min.length);      // -> 30
console.log(waveform.min[0]);          // -> -9
```

# WaveformData.prototype.set_segment()

<table>
  <tr>
    <th><code>start</code></th>
    <td><code>Integer</code></td>
    <td>Beginning of the segment (inclusive)</td>
  </tr><tr>
    <th><code>end</code></th>
    <td><code>Integer</code></td>
    <td>Ending of the segment (exclusive)</td>
  </tr><tr>
    <th><code>identifier</code></th>
    <td><code>String*</code></td>
    <td>Unique identifier. If nothing is specified, *default* will be used as a value.</td>
  </tr>
</table>

* `@return` `WaveformDataSegment` 


> Creates a new segment of data.
Pretty handy if you need to bookmark a duration and display it according to the current offset.

```javascript
var waveform = WaveformData.create({ ... });

console.log(Object.keys(waveform.segments));          // -> []

waveform.set_segment(10, 120);
waveform.set_segment(30, 90, "speakerA");

console.log(Object.keys(waveform.segments));          // -> ['default', 'speakerA']
console.log(waveform.segments.default.min.length);    // -> 110
console.log(waveform.segments.speakerA.min.length);   // -> 60
```

# WaveformData.prototype.set_point()

<table>
  <tr>
    <th><code>timeStamp</code></th>
    <td><code>Integer</code></td>
    <td>the time to place the bookmark</td>
  </tr><tr>
    <th><code>identifier</code></th>
    <td><code>String*</code></td>
    <td>Unique identifier. If nothing is specified, *default* will be used as a value.</td>
  </tr>
</table>

* `@return` `WaveformDataPoint` 


> Creates a new point of data.
Pretty handy if you need to bookmark a specific point and display it according to the current offset.

```javascript
var waveform = WaveformData.create({ ... });

console.log(Object.keys(waveform.points));          // -> []

waveform.set_point(10);
waveform.set_point(30, "speakerA");

console.log(Object.keys(waveform.points));          // -> ['default', 'speakerA']
```

# WaveformData.prototype.remove_point()

<table>
  <tr>
    <th><code>identifier</code></th>
    <td><code>String*</code></td>
    <td>Unique identifier. If nothing is specified, *default* will be used as a value.</td>
  </tr>
</table>

* `@return` `null` 


> Removes a point of data.

```javascript
var waveform = WaveformData.create({ ... });

console.log(Object.keys(waveform.points));          // -> []

waveform.set_point(30, "speakerA");
console.log(Object.keys(waveform.points));          // -> ['speakerA']
waveform.remove_point("speakerA");
console.log(Object.keys(waveform.points));          // -> []
```

# WaveformData.prototype.resample()

<table>
  <tr>
    <th><code>Number,</code></th>
    <td><code>Number</code> | <code>width:</code></td>
    <td>scale: Number}} options Either a constraint width or a constraint sample rate</td>
  </tr>
</table>

* See: [https://code.google.com/p/audacity/source/browse/audacity-src/trunk/src/Sequence.cpp](https://code.google.com/p/audacity/source/browse/audacity-src/trunk/src/Sequence.cpp)
* `@return` `WaveformData` New resampled object


> Creates a new WaveformData object with resampled data.
Returns a rescaled waveform, to either fit the waveform to a specific width, or to a specific zoom level.

**Note**: You may specify either the *width* or the *scale*, but not both. The `scale` will be deduced from the `width` you want to fit the data into.

Adapted from Sequence::GetWaveDisplay in Audacity, with permission.

```javascript
// ...
var waveform = WaveformData.create({ ... });

// fitting the data in a 500px wide canvas
var resampled_waveform = waveform.resample({ width: 500 });

console.log(resampled_waveform.min.length);   // -> 500

// zooming out on a 3 times less precise scale
var resampled_waveform = waveform.resample({ scale: waveform.adapter.scale * 3 });

// partial resampling (to perform fast animations involving a resampling per animation frame)
var partially_resampled_waveform = waveform.resample({ width: 500, from: 0, to: 500 });

// ...
```

# WaveformData.prototype.min


* `@api`
* `@return` `Array.<Integer>` Min values contained in the offset.


> Returns all the min peaks values.

```javascript
var waveform = WaveformData.create({ ... });

console.log(waveform.min.length);      // -> 150
console.log(waveform.min[0]);          // -> -12

waveform.offset(20, 50);

console.log(waveform.min.length);      // -> 30
console.log(waveform.min[0]);          // -> -9
```

# WaveformData.prototype.max


* `@api`
* `@return` `Array.<Integer>` Max values contained in the offset.


> Returns all the max peaks values.

```javascript
var waveform = WaveformData.create({ ... });

console.log(waveform.max.length);      // -> 150
console.log(waveform.max[0]);          // -> 12

waveform.offset(20, 50);

console.log(waveform.max.length);      // -> 30
console.log(waveform.max[0]);          // -> 5
```

# WaveformData.prototype.offsetValues()

<table>
  <tr>
    <th><code>start</code></th>
    <td><code>Integer</code></td>
    <td></td>
  </tr><tr>
    <th><code>length</code></th>
    <td><code>Integer</code></td>
    <td></td>
  </tr><tr>
    <th><code>correction</code></th>
    <td><code>Integer</code></td>
    <td>The step to skip for each iteration (as the response body is [min, max, min, max...])</td>
  </tr>
</table>

* `@return` `Array.<Integer>` 


> Return the unpacked values for a particular offset.

# WaveformData.prototype.duration


* `@api`
* `@return` `number` Duration of the audio waveform, in seconds.


> Compute the duration in seconds of the audio file.

```javascript
var waveform = WaveformData.create({ ... });
console.log(waveform.duration);    // -> 10.33333333333

waveform.offset(20, 50);
console.log(waveform.duration);    // -> 10.33333333333
```

# WaveformData.prototype.offset_duration


* `@api`
* `@return` `number` Duration of the offset, in seconds.


> Return the duration in seconds of the current offset.

```javascript
var waveform = WaveformData.create({ ... });

console.log(waveform.offset_duration);    // -> 10.33333333333

waveform.offset(20, 50);

console.log(waveform.offset_duration);    // -> 2.666666666667
```

# WaveformData.prototype.pixels_per_second


* `@api`
* `@return` `number` Number of pixels per second.


> Return the number of pixels per second.

```javascript
var waveform = WaveformData.create({ ... });

console.log(waveform.pixels_per_second);       // -> 93.75
```

# WaveformData.prototype.seconds_per_pixel


* `@return` `number` Amount of time (in seconds) contained in a pixel.


> Return the amount of time represented by a single pixel.

```javascript
var waveform = WaveformData.create({ ... });

console.log(waveform.seconds_per_pixel);       // -> 0.010666666666666666
```

# WaveformData.prototype.at()

<table>
  <tr>
    <th><code>index</code></th>
    <td><code>Integer</code></td>
    <td></td>
  </tr>
</table>

* `@proxy`
* `@return` `number` Offset value


> Returns a value at a specific offset.

```javascript
var waveform = WaveformData.create({ ... });

console.log(waveform.at(20));              // -> -7
console.log(waveform.at(21));              // -> 12
```

# WaveformData.prototype.at_time()

<table>
  <tr>
    <th><code>time</code></th>
    <td><code>number</code></td>
    <td></td>
  </tr>
</table>

* `@return` `integer` Index location for a specific time.


> Return the pixel location for a certain time.

```javascript
var waveform = WaveformData.create({ ... });

console.log(waveform.at_time(0.0000000023));       // -> 10
```
# WaveformData.prototype.time()

<table>
  <tr>
    <th><code>index</code></th>
    <td><code>Integer</code></td>
    <td></td>
  </tr>
</table>

* `@return` `number` 


> Returns the time in seconds for a particular index

```javascript
var waveform = WaveformData.create({ ... });

console.log(waveform.time(10));                    // -> 0.0000000023
```

# WaveformData.prototype.in_offset()

<table>
  <tr>
    <th><code>pixel</code></th>
    <td><code>number</code></td>
    <td></td>
  </tr>
</table>

* `@return` `boolean` True if the pixel lies in the current offset, false otherwise.


> Return if a pixel lies within the current offset.

```javascript
var waveform = WaveformData.create({ ... });

console.log(waveform.in_offset(50));      // -> true
console.log(waveform.in_offset(120));     // -> true

waveform.offset(100, 150);

console.log(waveform.in_offset(50));      // -> false
console.log(waveform.in_offset(120));     // -> true
```

# WaveformData.prototype.min_sample()

<table>
  <tr>
    <th><code>offset</code></th>
    <td><code>Integer</code></td>
    <td></td>
  </tr>
</table>

* `@return` `Number` Offset min value


> Returns a min value for a specific offset.

```javascript
var waveform = WaveformData.create({ ... });

console.log(waveform.min_sample(10));      // -> -7
```

# WaveformData.prototype.max_sample()

<table>
  <tr>
    <th><code>offset</code></th>
    <td><code>Integer</code></td>
    <td></td>
  </tr>
</table>

* `@return` `Number` Offset max value


> Returns a max value for a specific offset.

```javascript
var waveform = WaveformData.create({ ... });

console.log(waveform.max_sample(10));      // -> 12
```

# WaveformData.adapters


* `@type` `Object` 


> Available adapters to manage the data backends.

