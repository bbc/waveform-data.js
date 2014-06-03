# WaveformDataPoint

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

* See: `WaveformData.prototype.set_point`
* `@constructor`


> Points are an easy way to keep track bookmarks of the described audio file.

They return values based on the actual offset. Which means if you change your offset and:

* a point becomes **out of scope**, no data will be returned; 
* a point is **fully included in the offset**, its whole content will be returned.

Points are created with the `WaveformData.set_point(timeStamp, name?)` method.

# this.timeStamp


* `@type` `Integer` 


> Start index.

```javascript
var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
waveform.set_point(10, "example");

console.log(waveform.points.example.timeStamp);  // -> 10

waveform.offset(20, 50);
console.log(waveform.points.example.timeStamp);  // -> 10

waveform.offset(70, 100);
console.log(waveform.points.example.timeStamp);  // -> 10
```
# WaveformDataPoint.prototype.visible


* `@return` `Boolean` True if visible, false otherwise.


> Indicates if the point has some visible part in the actual WaveformData offset.

```javascript
var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
waveform.set_point(10, "example");

console.log(waveform.points.example.visible);        // -> true

waveform.offset(0, 50);
console.log(waveform.points.example.visible);        // -> true

waveform.offset(70, 100);
console.log(waveform.points.example.visible);        // -> false
```

