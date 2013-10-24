"use strict";

var getJSONFakeData = module.exports.json = function getJSONFakeData(){
  return {
    "length": 10,
    "bits": 8,
    "sample_rate": 48000,
    "samples_per_pixel": 512,
    "data": [
      0, 0, -10, 10, 0, 0, -5, 7, -5, 7,
      0, 0, 0, 0, 0, 0, 0, 0, -2, 2
    ]
  };
};

getJSONFakeData.expected = {
  length: 10,
  sample_rate: 48000,
  samples_per_pixel: 512,
  duration: 0.10666666666666667, //10 * 512 / 48000
  pixels_per_second: 0,
  resampled_length: 5,
  resampled_values: [-10, 10, -5, 7, -5, 7, 0, 0, -2, 2]
};

var getArrayBufferFakeData = module.exports.arraybuffer = function getArrayBufferFakeData(){
  var fixtures = getJSONFakeData();

  var view = new DataView(new ArrayBuffer(20 + fixtures.data.length));

  view.setInt32(0, 1, true);
  view.setUint32(4, fixtures.bits === 8 ? 1 : 0, true);
  view.setInt32(8, fixtures.sample_rate, true);
  view.setInt32(12, fixtures.samples_per_pixel, true);
  view.setUint32(16, fixtures.data.length / 2, true);

  fixtures.data.forEach(function(value, index){
    view.setInt8(20 + index, value);
  });

  return view.buffer;
};

getArrayBufferFakeData.expected = getJSONFakeData.expected;
getArrayBufferFakeData.expected.byteSize = 40;
