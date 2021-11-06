import WaveformData from "./waveform-data";

/**
 * Returns a new ArrayBuffer with the concatenated waveform.
 * All waveforms must have identical metadata (version, channels, etc)
 */

function concatBuffers(waveforms) {
  var totalDataLength = 0;
  var buffers = waveforms.map(function(waveform) {
    return waveform._data.buffer;
  });
  var i;
  var headerSize;

  for (i = 0; i < buffers.length; i++) {
    totalDataLength += waveforms[i].length;
  }

  var totalSize = 24 + totalDataLength * (waveforms[0].bits / 8) * waveforms[0].channels * 2;

  var outputBuffer = new ArrayBuffer(totalSize);
  var outputDataView = new DataView(outputBuffer);

  // Create the header block
  outputDataView.setInt32(0, 2, true); // Version
  outputDataView.setUint32(4, waveforms[0].bits === 8, true);
  outputDataView.setInt32(8, waveforms[0].sample_rate, true);
  outputDataView.setInt32(12, waveforms[0].scale, true);
  outputDataView.setInt32(16, totalDataLength, true);
  outputDataView.setInt32(20, waveforms[0].channels, true);

  var offset = 24;
  var outputBufferData = new Uint8Array(outputBuffer);

  for (i = 0; i < buffers.length; i++) {
    headerSize = waveforms[i]._offset;
    outputBufferData.set(new Uint8Array(buffers[i], headerSize), offset);
    offset += buffers[i].byteLength - headerSize;
  }

  return outputBuffer;
}

/**
 * Concatenates with one or more other waveforms, returning a new WaveformData object.
 */

function concatWaveformData() {
  var waveforms = Array.prototype.slice.call(arguments);

  if (!waveforms[0]) {
    throw new Error("concatWaveformData(): One or more waveforms are required");
  }

  // Check that all the supplied waveforms are compatible
  for (var i = 1; i < waveforms.length; i++) {
    if (waveforms[i].channels !== waveforms[0].channels ||
      waveforms[i].sample_rate !== waveforms[0].sample_rate ||
      waveforms[i].bits !== waveforms[0].bits ||
      waveforms[i].scale !== waveforms[0].scale) {
      throw new Error("concatWaveformData(): Waveforms are incompatible");
    }
  }

  var combinedBuffer = concatBuffers(waveforms);

  return WaveformData.create(combinedBuffer);
}

export default concatWaveformData;
