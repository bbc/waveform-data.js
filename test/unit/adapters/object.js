"use strict";

/* globals beforeEach, context, describe, it */

var WaveformData = require("../../../waveform-data");
var constructor = WaveformData.adapters.object;
var fixtures = require("../../fixtures");
var expect = require("chai").expect;

describe("WaveformData Object Adapter", function() {
  var instance;

  it("should have the `fromResponseData` static property", function() {
    expect(constructor.fromResponseData).to.be.a("function");
  });

  it("should return a WaveformDataAdapter instance from `fromResponseData` factory", function() {
    const data = fixtures.getJSONData({ channels: 1 });

    expect(constructor.fromResponseData(data)).to.be.an("object");
    expect(constructor.fromResponseData(JSON.stringify(data))).to.be.an("object");
  });

  context("with a single channel data file", function() {
    beforeEach(function() {
      const data = fixtures.getJSONData({ channels: 1 });

      instance = constructor.fromResponseData(data);
    });

    it("should return the data version number", function() {
      expect(instance.version).to.equal(1);
    });

    it("should return the number of channels", function() {
      expect(instance.channels).to.equal(1);
    });

    it("should contain 8-bit data", function() {
      expect(instance.is_8_bit).to.be.true;
      expect(instance.is_16_bit).to.be.false;
    });

    it("should return the sample rate", function() {
      expect(instance.sample_rate).to.equal(48000);
    });

    it("should return the scale (samples per pixel)", function() {
      expect(instance.scale).to.equal(512);
    });

    it("should return the length of the waveform", function() {
      expect(instance.length).to.equal(10);
    });

    it("should return waveform data points", function() {
      expect(instance.at(0)).to.equal(0);
      expect(instance.at(8)).to.equal(-5);
      expect(instance.at(9)).to.equal(7);
      expect(instance.at(10)).to.equal(0);
      expect(instance.at(19)).to.equal(2);
    });

    it("should throw on indexing beyond the length of the data", function() {
      expect(function() {
        instance.at(20);
      }).to.throw(RangeError);
    });
  });

  context("with a two-channel data file", function() {
    beforeEach(function() {
      const data = fixtures.getJSONData({ channels: 2 });

      instance = constructor.fromResponseData(data);
    });

    it("should return the data version number", function() {
      expect(instance.version).to.equal(2);
    });

    it("should return the number of channels", function() {
      expect(instance.channels).to.equal(2);
    });

    it("should contain 8-bit data", function() {
      expect(instance.is_8_bit).to.be.true;
      expect(instance.is_16_bit).to.be.false;
    });

    it("should return the sample rate", function() {
      expect(instance.sample_rate).to.equal(48000);
    });

    it("should return the scale (samples per pixel)", function() {
      expect(instance.scale).to.equal(512);
    });

    it("should return the length of the waveform", function() {
      expect(instance.length).to.equal(10);
    });

    it("should return waveform data points", function() {
      expect(instance.at(0)).to.equal(0);
      expect(instance.at(4)).to.equal(-10);
      expect(instance.at(6)).to.equal(-8);
      expect(instance.at(13)).to.equal(7);
      expect(instance.at(39)).to.equal(3);
    });

    it("should throw on indexing beyond the length of the data", function() {
      expect(function() {
        instance.at(40);
      }).to.throw(RangeError);
    });
  });
});
