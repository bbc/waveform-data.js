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
  * [.at_time](#waveformDataat_timetime)
  * [.time](#waveformDatatimeindex)
  * [.channels](#waveformDatachannels)
  * [.channel](#waveformDatachannelindex)
  * [.resample](#waveformDataresampleoptions)
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

### waveformData.create(data)

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

### waveformData.createFromAudio(options, callback)

Creates a [`WaveformData`](#waveformdata) object from audio using the Web
Audio API.

#### Arguments

| Name        | Type                 |
| ----------- | -------------------- |
| `options`   | `Object` (see below) |
| `callback`  | Function             |

#### Options

| Name              | Type                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `audio_context`   | [`AudioContext`](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext)                               |
| `array_buffer`    | [`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) |
| `audio_buffer`    | [`AudioBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer)                                 |
| `scale`           | Number (integer, default: 512)                                                                                |
| `amplitude_scale` | Number (default: 1.0)                                                                                         |
| `split_channels`  | Boolean (default: false)                                                                                      |

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

You can resample a subset of the waveform, which is useful for
performing fast animations involving a resampling per animation
frame.

```javascript
const waveform = WaveformData.create(buffer);
const resampledWaveform = waveform.resample({ width: 500, from: 0, to: 500 });
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

Returns all the waveform minimum values within the current offset, as an array.

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

Returns all the waveform maximum values within the current offset, as an array.

```javascript
const waveform = WaveformData.create(buffer);
const channel = waveform.channel(0);

console.log(waveform.length); // -> 3

const max = channel.max_array(); // -> [7, 5, 10]

for (let i = 0; i < waveform.length; i++) {
  console.log(max[i]);
}
```
