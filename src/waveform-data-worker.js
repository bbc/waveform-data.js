import generateWaveformData from "./generate";

onmessage = function(evt) {
  var buffer = generateWaveformData(evt.data);

  // Transfer buffer to the calling thread
  this.postMessage(buffer, [buffer]);
  this.close();
};
