"use strict";

/* globals describe, it, beforeEach */
// jshint -W030

var WaveformData = require("../../dist/waveform-data.min.js");
var getArrayBufferFakeData = require("../fixtures").arraybuffer;
var getJSONFakeData = require("../fixtures").json;
var expect = require("chai").expect;

if (XMLHttpRequest === undefined){
  // jshint -W079
  var XMLHttpRequest = function(){ return {}; };
}

describe("WaveformData Core object", function(){
  var instance;
  var expectations = getArrayBufferFakeData.expected;

  it("should provide an `adapter` static properties and an `adapters` storage.", function(){
    expect(WaveformData.adapters).to.be.an('object');
    expect(WaveformData.adapter).to.be.a('function');
  });

  describe("Create Factory", function(){
    it("should not build an instance for an unknown data type.", function(){
      expect(function(){ WaveformData.create(0); }).to.throw("Could not detect a WaveformData adapter from the input.");
      expect(function(){ WaveformData.create(null); }).to.throw("Could not detect a WaveformData adapter from the input.");
    });

    it("should detect the proper adapter based on raw data.", function(){
      expect(WaveformData.create(getJSONFakeData()).adapter).to.be.an.instanceOf(WaveformData.adapters.object);
      expect(WaveformData.create(JSON.stringify(getJSONFakeData())).adapter).to.be.an.instanceOf(WaveformData.adapters.object);
      expect(WaveformData.create(getArrayBufferFakeData()).adapter).to.be.an.instanceOf(WaveformData.adapters.arraybuffer);
    });

    it("should detect the proper adapter based on an http response", function(){
      var jsonAsTextResponse = { response: JSON.stringify(getJSONFakeData()), responseText: JSON.stringify(getJSONFakeData()) };
      var jsonAsObjectResponse = { response: getJSONFakeData(), responseType: "json", responseText: new Error("Accessing this property throws an exception in the browser.") };
      var arrayBufferResponse = { response: getArrayBufferFakeData(), responseType: "arraybuffer", responseText: new Error("Accessing this property throws an exception in the browser.") };

      expect(function(){ WaveformData.create(new XMLHttpRequest()); }).to.throw("Could not detect a WaveformData adapter from the input.");
      expect(WaveformData.create(jsonAsTextResponse).adapter).to.be.an.instanceOf(WaveformData.adapters.object);
      expect(WaveformData.create(jsonAsObjectResponse).adapter).to.be.an.instanceOf(WaveformData.adapters.object);
      expect(WaveformData.create(arrayBufferResponse).adapter).to.be.an.instanceOf(WaveformData.adapters.arraybuffer);
    });
  });

  beforeEach(function(){
    instance = new WaveformData(getArrayBufferFakeData(), WaveformData.adapters.arraybuffer);
  });

  it("should enable us to create a valid offset of data.", function(){
    expect(instance.offset_length).to.equal(expectations.length);
    expect(instance.offset_end).to.equal(expectations.length);

    // remember kids, if data length = 10, we have 20 items in the array
    // but it's internal and no one cares about it
    // so we always think in terms of pixel display

    // regular usage
    instance.offset(2, 5); // last offset is 2+5 = 7
    expect(instance.offset_length).to.equal(3);
    expect(instance.offset_end).to.equal(5);

    // ending after the length
    instance.offset(5, 15);
    expect(instance.offset_length).to.equal(5);  // because index 5 to 9 [total is 0 -> 9]
    expect(instance.offset_end).to.equal(10);

    // negative start and ends
    expect(function(){ instance.offset(0, -5); }).to.throw(Error);
    expect(function(){ instance.offset(-5, 25); }).to.throw(Error);

    // starting after the length
    expect(function(){ instance.offset(15, 25); }).to.throw(Error);

    // ending before the beginning (if you think the second argument is length)
    expect(function(){ instance.offset(15, 5); }).to.throw(Error);
  });

  it("should return all the minimum values of the offset.", function(){
    instance.offset(2, 5);

    expect(instance.min).to.have.length.of(3);   //same as previous test
    expect(instance.min[0]).to.equal(0);       //means index 5
    expect(instance.min[1]).to.equal(-5);      //means index 7
  });

  it("should return all the maximum values of the offset.", function(){
    instance.offset(2, 5);

    expect(instance.max).to.have.length.of(3);   //same as previous test
    expect(instance.max[0]).to.equal(0);       //means index 6
    expect(instance.max[1]).to.equal(7);       //means index 8
  });

  it("should calculate the audio duration based on internal data.", function(){
    expect(instance.duration).to.equal(expectations.duration);

    instance.offset(2, 5);
    expect(instance.duration).to.equal(expectations.duration);   // if should not affect the whole duration
  });

  it("should calculate the audio offset duration based on internal data.", function(){
    expect(instance.offset_duration).to.equal(expectations.duration);

    instance.offset(2, 5);
    expect(instance.offset_duration).to.equal(0.032);   //3 * 512 / 48000
  });

  it("should compute the number of pixels per seconds for this set of data.", function(){
      expect(instance.pixels_per_second).to.equal(93.75);   //48000 / 512
  });

  it("should compute the number of seconds per pixel for this set of data.", function(){
    expect(instance.seconds_per_pixel).to.equal(0.010666666666666666);    //512 / 48000
  });

  it("should calculate the pixel value for a given time in seconds.", function(){
    expect(instance.at_time(0)).to.equal(0);
    expect(instance.at_time(0.15)).to.equal(14);      //floor 0.15 * 48000 / 512
    expect(instance.at_time(1)).to.equal(93);         //floor 1 * 48000 / 512 (~ pixels_per_second, brilliant!)
  });

  it("should calculate the time in seconds for a given pixel index.", function(){
    //not sure they are the expected values. Should check the operator priority
    expect(instance.time(0)).to.equal(0);
    expect(instance.time(0.15)).to.equal(0.0015999999999999999); //0.15 * 512 / 48000
    expect(instance.time(1)).to.equal(0.010666666666666666);     //1 * 512 / 48000
  });

  it("should be able to determine if a pixel index belong to the active offset", function(){
    expect(instance.in_offset(0)).to.be.true;
    expect(instance.in_offset(9)).to.be.true;
    expect(instance.in_offset(10)).to.be.false;

    instance.offset(4, 6);
    expect(instance.in_offset(2)).to.be.false;
    expect(instance.in_offset(6)).to.be.false;
    expect(instance.in_offset(5)).to.be.true;
  });

  it("should return the proper minimum value for a given pixel index.", function(){
    expect(instance.min_sample(0)).to.equal(0);
    expect(instance.min_sample(4)).to.equal(-5);
    expect(instance.min_sample(9)).to.equal(-2);
  });

  it("should return the proper maximum value for a given pixel index.", function(){
    expect(instance.max_sample(0)).to.equal(0);
    expect(instance.max_sample(4)).to.equal(7);
    expect(instance.max_sample(9)).to.equal(2);
  });

  it("should resample the data as a new WaveformData object.", function(){
    var resampled;

    //upscalling
    expect(function(){ instance.resample(20); }).to.throw(Error);

    //by width
    resampled = instance.resample({ width: 5 });
    expect(resampled.adapter).to.have.length.of(instance.resample(5).adapter.length);
    expect(resampled.duration).to.equal(expectations.duration);

    //by scale
    //if we double the scale, it should fit in half the previous size (which means 5px)
    resampled = instance.resample({ scale: 1024 });
    expect(resampled.adapter).to.have.length.of(expectations.resampled_length);
    expect(resampled.duration).to.equal(expectations.duration);

    //checking resampled values
    expectations.resampled_values.forEach(function(expectedValue, i){
      expect(resampled.at(i)).to.equal(expectedValue);
    });
  });

  it("should throw an exception if start is negative.", function(){
    expect(function(){ instance.offset(-1, 10); }).to.throw(Error);
  });

  it("should throw an exception if end is negative.", function(){
    expect(function(){ instance.offset(1, -1); }).to.throw(Error);
  });
});
