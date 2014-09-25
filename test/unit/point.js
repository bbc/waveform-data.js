"use strict";

/* globals describe, it, beforeEach */
// jshint -W030

var WaveformData = require("../../waveform-data.js");
var getArrayBufferFakeData = require("../fixtures").arraybuffer;
var expect = require("chai").expect;

describe("WaveformData Point object", function(){
  var instance;

  beforeEach(function(){
    instance = new WaveformData(getArrayBufferFakeData(), WaveformData.adapters.arraybuffer);
  });

  it("should create a named point of data.", function(){
    instance.set_point(1);
    instance.set_point(3, 'sample');

    expect(Object.keys(instance.points)).to.have.length.of(2);
    expect(instance.points.default.timeStamp).to.equal(1);
    expect(instance.points.sample.timeStamp).to.equal(3);
  });

  it("should remove a named point of data.", function() {
    instance.set_point(1);
    instance.set_point(2, 'sample');

    expect(Object.keys(instance.points)).to.have.length.of(2);

    instance.remove_point('default');
    expect(Object.keys(instance.points)).to.have.length.of(1);

  });

  it("should remove a named point of data (false values)", function() {
    instance.set_point(0, 0);
    instance.set_point(1, "1");

    expect(Object.keys(instance.points)).to.have.length.of(2);

    instance.remove_point(0);

    expect(Object.keys(instance.points)).to.have.length.of(1);
    expect(instance.points['1'].timeStamp).to.equal(1);
  });

  it("should indicate if the point is visible in the offset.", function(){
    instance.set_point(2);
    expect(instance.points['default'].visible).to.be.true;

    instance.offset(2, 9);
    expect(instance.points['default'].visible).to.be.true;

    instance.offset(3, 8);
    expect(instance.points['default'].visible).to.be.false;
  });
});