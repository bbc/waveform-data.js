"use strict";

/* globals describe, it, beforeEach */
// jshint -W030

var WaveformData = require("../../../waveform-data.js");
var constructor = WaveformData.adapters.object;
var getJSONFakeData = require("../../fixtures").json;
var expect = require("chai").expect;

describe("WaveformData Object Adapter", function(){
  var instance;

  it("should have the `fromResponseData` static property.", function(){
    expect(constructor.fromResponseData).to.be.a('function');
  });

  it("should return a WaveformDataAdapter instance from `fromResponseData` factory.", function(){
    var fakeData = getJSONFakeData();

    expect(constructor.fromResponseData(fakeData)).to.be.an('object');
    expect(constructor.fromResponseData(JSON.stringify(fakeData))).to.be.an('object');
  });

  beforeEach(function(){
    instance = constructor.fromResponseData(getJSONFakeData());
  });

  it("should return a supported version number (1 so far).", function(){
    expect(instance.version).to.equal(1);
  });

  it("should contain 8 bits data only (16 is not properly handled yet).", function(){
    expect(instance.is_8_bit).to.be.true;
    expect(instance.is_16_bit).to.be.false;
  });

  it("should provide the expected sample rate.", function(){
    expect(instance.sample_rate).to.equal(48000);
  });

  it("should provide the expected scale (samples per pixel).", function(){
    expect(instance.scale).to.equal(512);
  });

  it("should return the expected samples length (not the length of the data object)", function(){
    expect(instance.length).to.equal(10);
    expect(instance.data.data).to.have.length.of(20);
  });

  it("should return the proper data index value.", function(){
    expect(instance.at(0)).to.equal(0);
    expect(instance.at(8)).to.equal(-5);
    expect(instance.at(9)).to.equal(7);
    expect(instance.at(10)).to.equal(0);
    expect(instance.at(19)).to.equal(2);
    expect(isNaN(instance.at(20))).to.be.true;
  });
});