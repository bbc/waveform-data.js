# WaveformDataSegment

<table>
  <tr>
    <th><code>context</code></th>
    <td><code>WaveformData</code></td>
    <td>WaveformData instance</td>
  </tr><tr>
    <th><code>start</code></th>
    <td><code>Integer</code></td>
    <td>Initial start index</td>
  </tr><tr>
    <th><code>end</code></th>
    <td><code>Integer</code></td>
    <td>Initial end index</td>
  </tr>
</table>

* See: `WaveformData.prototype.set_segment`
* `@constructor`


> Segments are an easy way to keep track of portions of the described audio file.

They return values based on the actual offset. Which means if you change your offset and:

* a segment becomes **out of scope**, no data will be returned;
* a segment is only **partially included in the offset**, only the visible parts will be returned;
* a segment is **fully included in the offset**, its whole content will be returned.

Segments are created with the `WaveformData.set_segment(from, to, name?)` method.

# this.start


* `@type` `Integer` 


> Start index.

```javascript
var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
waveform.set_segment(10, 50, "example");

console.log(waveform.segments.example.start);  // -> 10

waveform.offset(20, 50);
console.log(waveform.segments.example.start);  // -> 10

waveform.offset(70, 100);
console.log(waveform.segments.example.start);  // -> 10
```
# this.end


* `@type` `Integer` 


> End index.

```javascript
var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
waveform.set_segment(10, 50, "example");

console.log(waveform.segments.example.end);  // -> 50

waveform.offset(20, 50);
console.log(waveform.segments.example.end);  // -> 50

waveform.offset(70, 100);
console.log(waveform.segments.example.end);  // -> 50
```
# WaveformDataSegment.prototype.offset_start


* `@return` `number` Starting point of the segment within the waveform offset. (inclusive)


> Dynamic starting point based on the WaveformData instance offset.

```javascript
var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
waveform.set_segment(10, 50, "example");

console.log(waveform.segments.example.offset_start);  // -> 10

waveform.offset(20, 50);
console.log(waveform.segments.example.offset_start);  // -> 20

waveform.offset(70, 100);
console.log(waveform.segments.example.offset_start);  // -> null
```

# WaveformDataSegment.prototype.offset_end


* `@return` `number` Ending point of the segment within the waveform offset. (exclusive)


> Dynamic ending point based on the WaveformData instance offset.

```javascript
var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
waveform.set_segment(10, 50, "example");

console.log(waveform.segments.example.offset_end);  // -> 50

waveform.offset(20, 50);
console.log(waveform.segments.example.offset_end);  // -> 50

waveform.offset(70, 100);
console.log(waveform.segments.example.offset_end);  // -> null
```

# WaveformDataSegment.prototype.offset_length


* `@return` `number` Visible length of the segment within the waveform offset.


> Dynamic segment length based on the WaveformData instance offset.

```javascript
var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
waveform.set_segment(10, 50, "example");

console.log(waveform.segments.example.offset_length);  // -> 40

waveform.offset(20, 50);
console.log(waveform.segments.example.offset_length);  // -> 30

waveform.offset(70, 100);
console.log(waveform.segments.example.offset_length);  // -> 0
```

# WaveformDataSegment.prototype.length


* `@return` `number` Initial length of the segment.


> Initial length of the segment.

```javascript
var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
waveform.set_segment(10, 50, "example");

console.log(waveform.segments.example.length);  // -> 40

waveform.offset(20, 50);
console.log(waveform.segments.example.length);  // -> 40

waveform.offset(70, 100);
console.log(waveform.segments.example.length);  // -> 40
```

# WaveformDataSegment.prototype.visible


* `@return` `Boolean` True if at least partly visible, false otherwise.


> Indicates if the segment has some visible part in the actual WaveformData offset.

```javascript
var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
waveform.set_segment(10, 50, "example");

console.log(waveform.segments.example.visible);        // -> true

waveform.offset(20, 50);
console.log(waveform.segments.example.visible);        // -> true

waveform.offset(70, 100);
console.log(waveform.segments.example.visible);        // -> false
```

# WaveformDataSegment.prototype.min


* `@return` `Array.<Integer>` Min values of the segment.


> Return the minimum values for the segment.

```javascript
var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
waveform.set_segment(10, 50, "example");

console.log(waveform.segments.example.min.length);        // -> 40
console.log(waveform.segments.example.min.offset_length); // -> 40
console.log(waveform.segments.example.min[0]);            // -> -12

waveform.offset(20, 50);

console.log(waveform.segments.example.min.length);        // -> 40
console.log(waveform.segments.example.min.offset_length); // -> 30
console.log(waveform.segments.example.min[0]);            // -> -5
```

# WaveformDataSegment.prototype.max


* `@return` `Array.<Integer>` Max values of the segment.


> Return the maximum values for the segment.

```javascript
var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
waveform.set_segment(10, 50, "example");

console.log(waveform.segments.example.max.length);        // -> 40
console.log(waveform.segments.example.max.offset_length); // -> 40
console.log(waveform.segments.example.max[0]);            // -> 5

waveform.offset(20, 50);

console.log(waveform.segments.example.max.length);        // -> 40
console.log(waveform.segments.example.max.offset_length); // -> 30
console.log(waveform.segments.example.max[0]);            // -> 11
```

