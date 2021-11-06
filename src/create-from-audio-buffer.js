import WaveformData from "./waveform-data";
import generateWaveformData from "./generate";
import getOptions from "./options";
import WaveformDataWorker from "web-worker:./waveform-data-worker";

function getChannelData(audioBuffer) {
  var channels = [];

  for (var i = 0; i < audioBuffer.numberOfChannels; ++i) {
      channels.push(audioBuffer.getChannelData(i).buffer);
  }

  return channels;
}

/**
 * Creates a WaveformData instance from decoded audio in a Web Audio AudioBuffer
 * object.
 */

function createWaveformDataFromAudioBuffer(audioBuffer, options, callback) {
  options = getOptions(options);

  var channels = getChannelData(audioBuffer);
  var buffer;

  if (options.disable_worker) {
    buffer = generateWaveformData({
      scale: options.scale,
      amplitude_scale: options.amplitude_scale,
      split_channels: options.split_channels,
      length: audioBuffer.length,
      sample_rate: audioBuffer.sampleRate,
      channels: channels
    });

    callback(null, new WaveformData(buffer), audioBuffer);
  }
  else {
    var worker = new WaveformDataWorker();

    worker.onmessage = function(evt) {
      callback(null, new WaveformData(evt.data), audioBuffer);
    };

    worker.postMessage({
      scale: options.scale,
      amplitude_scale: options.amplitude_scale,
      split_channels: options.split_channels,
      length: audioBuffer.length,
      sample_rate: audioBuffer.sampleRate,
      channels: channels
    }, channels);
  }
}

export default createWaveformDataFromAudioBuffer;
