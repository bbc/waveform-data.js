import { generateWaveformData } from './waveform-generator';

onmessage = function(evt) {
  const buffer = generateWaveformData(evt.data);

  // Transfer buffer to the calling thread
  this.postMessage(buffer, [buffer]);
  this.close();
};
