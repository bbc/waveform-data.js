export function isJsonWaveformData(data) {
  return data &&
    typeof data === 'object' &&
    'sample_rate' in data &&
    'samples_per_pixel' in data &&
    'bits' in data &&
    'length' in data &&
    'data' in data;
}

export function isBinaryWaveformData(data) {
  const isCompatible = data && typeof data === 'object' && 'byteLength' in data;

  if (isCompatible) {
    const view = new DataView(data);
    const version = view.getInt32(0, true);

    if (version !== 1 && version !== 2) {
      throw new TypeError('WaveformData.create(): This waveform data version not supported');
    }
  }

  return isCompatible;
}

export function convertJsonToBinary(data) {
  const waveformData = data.data;
  const channels = data.channels || 1;
  const header_size = 24; // version 2
  const bytes_per_sample = data.bits === 8 ? 1 : 2;
  const expected_length = data.length * 2 * channels;

  if (waveformData.length !== expected_length) {
    throw new Error('WaveformData.create(): Length mismatch in JSON waveform data');
  }

  const total_size = header_size + waveformData.length * bytes_per_sample;

  const array_buffer = new ArrayBuffer(total_size);
  const data_object = new DataView(array_buffer);

  data_object.setInt32(0, 2, true); // Version
  data_object.setUint32(4, data.bits === 8, true);
  data_object.setInt32(8, data.sample_rate, true);
  data_object.setInt32(12, data.samples_per_pixel, true);
  data_object.setInt32(16, data.length, true);
  data_object.setInt32(20, channels, true);

  let index = header_size;

  if (data.bits === 8) {
    for (let i = 0; i < waveformData.length; i++) {
      data_object.setInt8(index++, waveformData[i], true);
    }
  }
  else {
    for (let i = 0; i < waveformData.length; i++) {
      data_object.setInt16(index, waveformData[i], true);

      index += 2;
    }
  }

  return array_buffer;
}
