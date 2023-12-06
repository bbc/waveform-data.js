# waveform-data.js API documentation

* [WaveformData](#waveformdata)
  * [.create](#waveformDatacreatedata)
  * [.createFromAudio](#waveformDatacreatefromaudiooptions-callback)
  * [.sample_rate](#waveformDatasample_rate)
  * [.scale](#waveformDatascale)
  * [.seconds_per_pixel](#waveformDataseconds_per_pixel)
  * [.pixels_per_second](#waveformDatapixels_per_second)
  * [.length](#waveformDatalength)
  * [.duration](#waveformDataduration)
  * [.bits](#waveformDatabits)
  * [.at_time](#waveformDataat_timetime)
  * [.time](#waveformDatatimeindex)
  * [.channels](#waveformDatachannels)
  * [.channel](#waveformDatachannelindex)
  * [.resample](#waveformDataresampleoptions)
  * [.concat](#waveformDataconcatwaveforms)
  * [.slice](#waveformDatasliceoptions)
  * [.toJSON](#waveformDatatojson)
  * [.toArrayBuffer](#waveformDatatoarraybuffer)
* [WaveformDataChannel](#waveformdatachannel)
  * [.min_sample](#waveformDataChannelmin_sampleindex)
  * [.max_sample](#waveformDataChannelmax_sampleindex)
  * [.min_array](#waveformDataChannelmin_array)
  * [.max_array](#waveformDataChannelmax_array)

## WaveformData

This is the main object you use to interact with the waveform data. It provides
access to the waveform data points and allows you to resample the data to
display the waveform at zoom levels or fit to a given width.

It also allows you to create waveform data from audio content using the Web
Audio API.

Use the following code to import it:

```javascript
import WaveformData from 'waveform-data';
```

### WaveformData.create(data)

Creates and returns a [`WaveformData`](#waveformdata) instance from the given
data, which may be in binary (.dat) format in an
[`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer),
or a JavaScript object. Refer to the
[data format documentation](https://github.com/bbc/audiowaveform/blob/master/doc/DataFormat.md)
for details.

#### Arguments

| Name   | Type                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------ |
| `data` | [`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) | `Object` |

#### Examples

To create a [`WaveformData`](#waveformdata) object from binary waveform data
(.dat format):

```javascript
fetch('http://example.com/waveforms/track.dat')
  .then(response => response.arrayBuffer())
  .then(buffer => WaveformData.create(buffer))
  .then(waveform => {
    console.log(`Waveform has ${waveform.channels} channels`);
    console.log(`Waveform has length ${waveform.length} points`);
  });
```

To create a [`WaveformData`](#waveformdata) object from JSON format waveform
data:

```javascript
fetch('http://example.com/waveforms/track.json')
  .then(response => response.json())
  .then(json => WaveformData.create(json))
  .then(waveform => {
    console.log(`Waveform has ${waveform.channels} channels`);
    console.log(`Waveform has length ${waveform.length} points`);
  });
```

Note that previous (v1.x) versions of **waveform-data.js** would accept JSON
strings as input, but this is not supported from v2.0 onwards.

### WaveformData.createFromAudio(options, callback)

Creates a [`WaveformData`](#waveformdata) object from audio using the Web
Audio API.

#### Arguments

| Name        | Type                 |
| ----------- | -------------------- |
| `options`   | `Object` (see below) |
| `callback`  | Function             |

#### Options

| Name              | Type                                                                                                          | Description |
| ----------------- | ------------------------------------------------------------------------------------------------------------- | - |
| `audio_context`   | [`AudioContext`](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext)                               | When using the `array_buffer` option to provide encoded audio, this should be a Web Audio `AudioContext` object, which will be used to decode the audio. Not required otherwise |
| `array_buffer`    | [`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) | Contains encoded audio. If using this option, an `audio_context` is also required |
| `audio_buffer`    | [`AudioBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer)                                 | Contains decoded audio. If using this option, an `audio_context` is not required |
| `scale`           | Number (integer, default: `512`)                                                                              | Controls the resolution of the waveform data by specifying the number of input audio samples per output waveform data point |
| `amplitude_scale` | Number (default: `1.0`)                                                                                       | Applies amplitude scaling to the waveform data. For example, set to `2.0` to double the waveform amplitude |
| `split_channels`  | Boolean (default: `false`)                                                                                    | Set to `true` to produce separate waveform channels instead of combining all channels into a single waveform |
| `disable_worker`  | Boolean (default: `false`)                                                                                    | Set to `true` to disable use of a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) |

#### Examples

To create a [`WaveformData`](#waveformdata) object from audio content in an
[`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer):

```javascript
const audioContext = new AudioContext();

fetch('https://example.com/audio/track.ogg')
  .then(response => response.arrayBuffer())
  .then(buffer => {
    const options = {
      audio_context: audioContext,
      array_buffer: buffer,
      scale: 512
    };

    WaveformData.createFromAudio(options, (err, waveform) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log(`Waveform has ${waveform.channels} channels`);
      console.log(`Waveform has length ${waveform.length} points`);
    });
  });
```

To create a [`WaveformData`](#waveformdata) object from an
[`AudioBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer):

```javascript
const audioContext = new AudioContext();
const sampleRate = audioContext.sampleRate;
const audioBuffer = audioContext.createBuffer(2, sampleRate * 4, sampleRate);

// TODO: Fill audioBuffer with audio content (4 seconds)

const options = {
  audio_buffer: audioBuffer
};

WaveformData.createFromAudio(options, (err, waveform) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log(`Waveform has ${waveform.channels} channels`);
  console.log(`Waveform has length ${waveform.length} points`);
});
```

To create a [`WaveformData`](#waveformdata) object with multi-channel waveform
data:

```javascript
const audioContext = new AudioContext();

fetch('https://example.com/audio/track.ogg')
  .then(response => response.arrayBuffer())
  .then(buffer => {
    const options = {
      audio_context: audioContext,
      array_buffer: buffer,
      scale: 512,
      split_channels: true
    };

    WaveformData.createFromAudio(options, (err, waveform) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log(`Waveform has ${waveform.channels} channels`);
      console.log(`Waveform has length ${waveform.length} points`);
    });
  });
```

To create a [`WaveformData`](#waveformdata) object without using a web worker,
set the `disable_worker` option to `true`. Waveform data is created in two steps:

* If you pass an `ArrayBuffer` containing encoded audio, the audio is decoded
  using the Web Audio API's [decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData)
  method. This must done on the browser's UI thread, so will be a blocking operation.

* The decoded audio is processed to produce the waveform data. To avoid further
  blocking the browser's UI thread, by default this step is done using a
  [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers),
  if supported by the browser. You can disable the worker and run the processing
  in the main thread by setting `disable_worker` to `true` in the options.

```javascript
const audioContext = new AudioContext();

fetch('https://example.com/audio/track.ogg')
  .then(response => response.arrayBuffer())
  .then(buffer => {
    const options = {
      audio_context: audioContext,
      array_buffer: buffer,
      scale: 512,
      disable_worker: true
    };

    WaveformData.createFromAudio(options, (err, waveform) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log(`Waveform has ${waveform.channels} channels`);
      console.log(`Waveform has length ${waveform.length} points`);
    });
  });
```

### waveformData.sample_rate

Returns the sample rate of the original audio, in Hz.

#### Example

```javascript
const waveform = WaveformData.create(buffer);

console.log(waveform.sample_rate); // -> 44100
```

### waveformData.scale

Returns the number of audio samples per pixel of the waveform data. This gives
an indication of the zoom level (higher numbers mean lower resolution, i.e.,
more zoomed out).

#### Example

```javascript
const waveform = WaveformData.create(buffer);

console.log(waveform.scale); // -> 512
```

### waveformData.seconds_per_pixel

Returns the amount of time (in seconds) represented by a single pixel.

#### Example

```javascript
const waveform = WaveformData.create(buffer);

console.log(waveform.seconds_per_pixel); // -> 0.010666666666666666
```

### waveformData.pixels_per_second

Returns the number of pixels per second.

#### Example

```javascript
const waveform = WaveformData.create(buffer);

console.log(waveform.pixels_per_second); // -> 93.75
```

### waveformData.length

Returns the length of the waveform data, in pixels.

#### Example

```javascript
const waveform = WaveformData.create(buffer);

console.log(waveform.length); // -> 1000
```

### waveformData.duration

Returns the approximate duration of the audio file, in seconds.

The duration is approximate because it is calculated based on the waveform
length, number of samples per pixel, and audio sample rate.

#### Example

```javascript
const waveform = WaveformData.create(buffer);

console.log(waveform.duration); // -> 10.32
```

### waveformData.bits

Returns the number of bits per sample, either 8 or 16.

#### Example

```javascript
const waveform = WaveformData.create(buffer);

console.log(waveform.bits); // -> 8
```

### waveformData.at_time(time)

Returns the pixel index for a given time.

#### Arguments

| Name   | Type             |
| ------ | ---------------- |
| `time` | Number (seconds) |

#### Example

```javascript
const waveform = WaveformData.create(buffer);

console.log(waveform.at_time(0.116)); // -> 10
```

### waveformData.time(index)

Returns the time in seconds for a given pixel index.

#### Arguments

| Name    | Type             |
| ------- | ---------------- |
| `index` | Number (integer) |

#### Example

```javascript
const waveform = WaveformData.create(buffer);

console.log(waveform.time(10)); // 0.116
```

### waveformData.channels

Returns the number of waveform channels.

Note: by default, [audiowaveform](https://github.com/bbc/audiowaveform)
combines all audio channels into a single channel waveform. Use the
`--split-channels` command-line option if you want multi-channel waveforms.

#### Example

```javascript
const waveform = WaveformData.create(buffer);
console.log(waveform.channels); // 1
```

### waveformData.channel(index)

Returns a [`WaveformDataChannel`](#waveformdatachannel) object that provides
access to the waveform data for the given channel index.

#### Arguments

| Name    | Type             |
| ------- | ---------------- |
| `index` | Number (integer) |

#### Example

```javascript
const waveform = WaveformData.create(buffer);

for (let i = 0; i < waveform.channels; i++) {
  const channel = waveform.channel(i);
}
```

### waveformData.resample(options)

Creates and returns a new [`WaveformData`](#waveformdata) object with resampled
data. Use this method to create waveform data at different zoom levels.

#### Arguments

| Name          | Type                 |
| ------------- | -------------------- |
| options       | `Object` (see below) |

#### Options

| Name    | Type             |
| ------- | ---------------- |
| `width` | Number (integer) |
| `scale` | Number (integer) |

#### Examples

To resample the waveform to fit to a specific width:

```javascript
const waveform = WaveformData.create(buffer);
const resampledWaveform = waveform.resample({ width: 500 });

console.log(resampledWaveform.length); // -> 500
```

To resample the waveform to a specific zoom level, in samples per pixel:

```javascript
const waveform = WaveformData.create(buffer);
const scale = waveform.scale; // -> 512
const resampledWaveform = waveform.resample({ scale: scale * 2 });

console.log(resampledWaveform.scale); // -> 1024
```

Note that you cannot resample to a lower number of samples per
pixel than the original waveform.

```javascript
const waveform = WaveformData.create(buffer);
const scale = waveform.scale; // -> 512
const resampledWaveform = waveform.resample({ scale: scale / 2 }); // throws an Error
```

### waveformData.concat(...waveforms)

Concatenates the receiver with one or more other waveforms, returning a new
[`WaveformData`](#waveformdata) object.

The waveforms must be compatible, i.e., have the same sample rate, scale,
and number of channels.

#### Arguments

| Name          | Type                                 |
| ------------- | ------------------------------------ |
| ...waveforms  | One or more `WaveformData` instances |

#### Example

To combine three waveforms into one long one:

```javascript
const wave1 = WaveformData.create(buffer1);
const wave2 = WaveformData.create(buffer2);
const wave3 = WaveformData.create(buffer3);
const combinedResult = wave1.concat(wave2, wave3);

console.log(wave1.length); // -> 500
console.log(wave2.length); // -> 300
console.log(wave3.length); // -> 100
console.log(combinedResult.length); // -> 900
```

### waveformData.slice(options)

Returns a subset of the waveform data between a given start and end point.

#### Arguments

| Name      | Type                                 |
| --------- | ------------------------------------ |
| `options` | An object containing either `startIndex` and `endIndex` values, which give the start and end indexes in the waveform data, or `startTime` and `endTime`, which give the start and end times (in seconds) |

#### Example

Return the waveform between index 100 and index 200:

```javascript
const waveform = WaveformData.create(buffer);

const slice = waveform.slice({ startIndex: 100, endIndex: 200 });

console.log(slice.length); // -> 100
```

Return the waveform between 1.0 and 2.0 seconds:

```javascript
const waveform = WaveformData.create(buffer);

const slice = waveform.slice({ startTime: 1.0, endTime: 2.0 });

console.log(slice.length); // -> 86
```

## waveformData.toJSON()

Returns an object containing the waveform data.
This means you can use [JSON.stringify()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
to produce a JSON string representation of the waveform data.

#### Example

```javascript
const waveform = WaveformData.create(buffer);

console.log(waveform.toJSON());
// { version: 2, channels: 1, sample_rate: 44100, samples_per_pixel: 512,
//   bits: 8, length: 4, data: [0, 0, -1, 1, -2, 2, -3, 3] }

console.log(JSON.stringify(waveform))
// '{"version":2,"channels":1,"sample_rate":44100,"samples_per_pixel":512,
//   "bits":8,"length":4,"data":[0,0,-1,1,-2,2,-3,3]}'
```

## waveformData.toArrayBuffer()

Returns an object containing the waveform data in [binary format](https://github.com/bbc/audiowaveform/blob/master/doc/DataFormat.md).

#### Example

```javascript
WaveformData.createFromAudio(buffer, function(err, waveformData) {
  const waveformData = waveform.toArrayBuffer();

  console.log(waveformData);
  // ArrayBuffer {
  //   [Uint8Contents]: <02 00 00 00 01 00 00 00 44 68 AC 00 00 80 00 00 00 65 14 etc.>,
  //   byteLength: 20908
  // }
});
```

## WaveformDataChannel

### waveformDataChannel.min_sample(index)

Returns the waveform minimum at the given index position.

#### Arguments

| Name    | Type             |
| ------- | ---------------- |
| `index` | Number (integer) |

#### Example

```javascript
const waveform = WaveformData.create(buffer);
const channel = waveform.channel(0);

for (let i = 0; i < waveform.length; i++) {
  const time = waveform.time(i);
  const min = channel.min_sample(i);
  const max = channel.max_sample(i);

  console.log(time, min, max);
}
```

### waveformDataChannel.max_sample(index)

Returns the waveform maximum at the given index position.

#### Arguments

| Name    | Type             |
| ------- | ---------------- |
| `index` | Number (integer) |

#### Example

```javascript
const waveform = WaveformData.create(buffer);
const channel = waveform.channel(0);

for (let i = 0; i < waveform.length; i++) {
  const time = waveform.time(i);
  const min = channel.min_sample(i);
  const max = channel.max_sample(i);

  console.log(time, min, max);
}
```

### waveformDataChannel.min_array()

Returns all the waveform minimum values as an array.

```javascript
const waveform = WaveformData.create(buffer);
const channel = waveform.channel(0);

console.log(waveform.length); // -> 3

const min = channel.min_array(); // -> [-7, -5, -10]

for (let i = 0; i < waveform.length; i++) {
  console.log(min[i]);
}
```

### waveformDataChannel.max_array()

Returns all the waveform maximum values as an array.

```javascript
const waveform = WaveformData.create(buffer);
const channel = waveform.channel(0);

console.log(waveform.length); // -> 3

const max = channel.max_array(); // -> [7, 5, 10]

for (let i = 0; i < waveform.length; i++) {
  console.log(max[i]);
}
```
