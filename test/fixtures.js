export function getJSONData(options) {
  if (!options) {
    options = {};
  }

  if (!("channels" in options)) {
    options.channels = 1;
  }

  if (!("bits" in options)) {
    options.bits = 8;
  }

  const data = {
    length: 10,
    bits: options.bits,
    sample_rate: 48000,
    samples_per_pixel: 512
  };

  if (options.channels === 1) {
    // Version 1 files don't include the version or channels fields
    // data.version = 1;
    // data.channels = 1;

    data.data = [
      0, 0,
      -10, 10,
      0, 0,
      -5, 7,
      -5, 7,
      0, 0,
      0, 0,
      0, 0,
      0, 0,
      -2, 2
    ];
  }
  else {
    data.version = 2;
    data.channels = options.channels;

    data.data = [
      0, 0, 0, 0,
      -10, 10, -8, 8,
      0, 0, -2, 2,
      -5, 7, -6, 3,
      -5, 7, -6, 3,
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
      -2, 2, -3, 3
    ];
  }

  if ("version" in options) {
    data.version = options.version;
  }

  return data;
}

export function getExpectedData(options) {
  return {
    length: 10,
    sample_rate: 48000,
    samples_per_pixel: 512,
    duration: 0.10666666666666667, // 10 * 512 / 48000
    pixels_per_second: 0,
    byte_size: 40,
    resampled_length: 5,
    resampled_values: {
      channels: {
        0: {
          min: [-10, -5, -5, 0, -2],
          max: [10, 7, 7, 0, 2]
        },
        1: {
          min: [-8, -6, -6, 0, -3],
          max: [8, 3, 3, 0, 3]
        }
      }
    }
  };
}

export function getBinaryData(options) {
  if (!options) {
    options = {};
  }

  if (!("channels" in options)) {
    options.channels = 1;
  }

  if (!("bits" in options)) {
    options.bits = 8;
  }

  const data = getJSONData(options);

  let version;

  if ("version" in options) {
    version = options.version;
  }
  else {
    version = options.channels === 1 ? 1 : 2;
  }

  const headerSize = version === 2 ? 24 : 20;

  const dataLength = data.bits === 8 ? headerSize + data.data.length
                                     : headerSize + data.data.length * 2;

  const view = new DataView(new ArrayBuffer(dataLength));

  view.setInt32(0, version, true);
  view.setUint32(4, data.bits === 8 ? 1 : 0, true);
  view.setInt32(8, data.sample_rate, true);
  view.setInt32(12, data.samples_per_pixel, true);
  view.setUint32(16, data.data.length / (2 * options.channels), true);

  if (version === 2) {
    view.setInt32(20, options.channels, true);
  }

  if (data.bits === 8) {
    data.data.forEach(function(value, index) {
      view.setInt8(headerSize + index, value);
    });
  }
  else {
    data.data.forEach(function(value, index) {
      view.setInt16(headerSize + index * 2, value, true);
    });
  }

  return view.buffer;
}
