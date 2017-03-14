"use strict";

/* globals describe, it, beforeEach */
// jshint -W030

var WaveformData = require("../../waveform-data.js");
var getArrayBufferFakeData = require("../fixtures").arraybuffer;
var getJSONFakeData = require("../fixtures").json;
var expect = require("chai").expect;

if (global.XMLHttpRequest === undefined) {
   global.XMLHttpRequest = function() { return null; };
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

  describe('.min', function(){
    beforeEach(function(){
      instance.offset(2, 5);
    });

    it('should return the 3 minimum values, at index 5, 7 and 9.', function(){
      expect(instance.min).to.deep.equal([0, -5, -5]);
    });
  });

  describe('.max', function(){
    beforeEach(function(){
      instance.offset(2, 5);
    });

    it('should return the 3 minimum values, at index 6, 8 and 10.', function(){
      expect(instance.max).to.deep.equal([0, 7, 7]);
    });
  });

  describe('.duration', function(){
    it('should return the duration of the media when no offset is set.', function(){
      expect(instance.duration).to.equal(expectations.duration);
    });

    it('should return the duration of the media even when an offset is set', function(){
      instance.offset(2, 5);
      expect(instance.duration).to.equal(expectations.duration);
    });
  });

  describe('.offset_duration', function(){
    it('should return the duration of the media when no offset is set.', function(){
      expect(instance.offset_duration).to.equal(expectations.duration);
    });

    it('should return the duration of the offset even when an offset is set', function(){
      instance.offset(2, 5);
      expect(instance.offset_duration).to.equal(0.032);   //3 * 512 / 48000
    });
  });

  describe('.pixels_per_second', function(){
    it("should compute the number of pixels per seconds for this set of data.", function(){
      expect(instance.pixels_per_second).to.equal(93.75);   //48000 / 512
    });
  });

  describe('.seconds_per_pixel', function(){
    it("should compute the number of seconds per pixel for this set of data.", function(){
      expect(instance.seconds_per_pixel).to.equal(0.010666666666666666);    //512 / 48000
    });
  });

  describe('.at_time', function(){
    it("should compute a location in pixel of 0 if the time is 0 seconds", function(){
      expect(instance.at_time(0)).to.equal(0);
    });

    it("should compute a location in pixel of 14 if the time is 0.15 seconds", function(){
      expect(instance.at_time(0.15)).to.equal(14);      //floor 0.15 * 48000 / 512
    });

    it("should compute a location in pixel of 93 if the time is 1 second", function(){
      expect(instance.at_time(1)).to.equal(93);         //floor 1 * 48000 / 512 (~ pixels_per_second, brilliant!)
    });
  });

  describe('.time', function(){
    it("should return a time of 0 seconds for a given pixel index of 0.", function(){
      expect(instance.time(0)).to.equal(0);
    });

    it("should return a time of 0.0015999999999999999 seconds for a given pixel index of 0.15.", function(){
      expect(instance.time(0.15)).to.equal(0.0015999999999999999); //0.15 * 512 / 48000
    });

    it("should return a time of 0.010666666666666666 seconds for a given pixel index of 1.", function(){
      expect(instance.time(1)).to.equal(0.010666666666666666);     //1 * 512 / 48000
    });
  });

  describe('.in_offset()', function(){
    it('should consider a pixel index of 0 to be in the offset, when not set', function(){
      expect(instance.in_offset(0)).to.be.true;
    });

    it('should consider a pixel index of 9 to be in the offset, when not set', function(){
      expect(instance.in_offset(9)).to.be.true;
    });

    it('should consider a pixel index of 10 not to be in the offset', function(){
      expect(instance.in_offset(10)).to.be.false;
    });

    it('should consider a pixel index of 4 to be in an offset of 4 to 6', function(){
      instance.offset(4, 6);
      expect(instance.in_offset(4)).to.be.true;
    });

    it('should consider a pixel index of 5 to be in an offset of 4 to 6', function(){
      instance.offset(4, 6);
      expect(instance.in_offset(5)).to.be.true;
    });

    it('should consider a pixel index of 6 not to be in an offset of 4 to 6', function(){
      instance.offset(4, 6);
      expect(instance.in_offset(6)).to.be.false;
    });
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

  describe('.resample()', function(){
    it('should throw an error when an upscaling tries to be achieved', function(){
      expect(function(){ instance.resample(20); }).to.throw(Error);
    });

    it('should throw an error if the scale value is not a positive integer', function(){
      expect(function(){ instance.resample({ scale: 0 }); }).to.throw(RangeError);
    });

    it('should throw an error if the width value is not a positive integer', function(){
      expect(function(){ instance.resample({ width: 0 }); }).to.throw(RangeError);
    });

    it('should throw an error if both width and scale are missing', function(){
      expect(function(){ instance.resample({}); }).to.throw(Error);
    });

    describe('full resample by width', function(){
      it('should resample to 5 elements if a width of 5 is requested', function(){
        expect(instance.resample({ width: 5 }).adapter).to.have.a.lengthOf(5);
      });

      it('should resample to an expected duration if a width of 5 is requested', function(){
        expect(instance.resample({ width: 5 })).to.have.property('duration', expectations.duration);
      });
    });

    //if we double the scale, it should fit in half the previous size (which means 5px)
    describe('full resample by scale', function(){
      it('should downsize the number of data by 2 if we request a half-size scaled resampled waveform', function(){
        expect(instance.resample({ scale: 1024 }).adapter).to.have.length.of(expectations.resampled_length);
      });

      it('should downsize the duration by 2 if we request a half-size scaled resampled waveform', function(){
        expect(instance.resample({ scale: 1024 })).to.have.property('duration', expectations.duration);
      });

      it('should resample to a set of expected values', function(){
        var resampled = instance.resample({ scale: 1024 });

        expectations.resampled_values.forEach(function(expectedValue, i){
          expect(resampled.at(i)).to.equal(expectedValue);
        });
      });
    });

    describe('partial resampling at a specific time', function(){
      it('should accept only a positive input_index value', function(){
        expect(function(){ instance.resample({ scale: 1024, input_index: -1 }); }).to.throw(RangeError);
      });

      it('should accept only a positive output_index value', function(){
        expect(function(){ instance.resample({ scale: 1024, output_index: -1 }); }).to.throw(RangeError);
      });

      it('should throw an exception if any of the 4 mandatories options are missing', function(){
        expect(function(){ instance.resample({ scale: 1024, input_index: 1, output_index: 1 }); }).to.throw(Error);
      });

      it('should crop the sample count to the defined length option value', function(){
        expect(instance.resample({ scale: 1024, input_index: 1, output_index: 1, width: 3 }).adapter).to.have.a.lengthOf(3);
      });
    });
  });

  describe('.offset()', function(){
    it("should throw an exception if start is negative.", function(){
      expect(function(){ instance.offset(-1, 10); }).to.throw(Error);
    });

    it("should throw an exception if end is negative.", function(){
      expect(function(){ instance.offset(1, -1); }).to.throw(Error);
    });
  });

  describe('.adapter', function(){
    it("should assign the provided argument as this.data", function(){
      var data = { foo: 'bar' };

      expect(new WaveformData.adapter(data)).to.have.property('data', data);
    });
  });
});
