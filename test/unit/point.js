"use strict";

/* globals describe, it, beforeEach */

var WaveformData = require("../../waveform-data");
var fixtures = require("../fixtures");
var expect = require("chai").expect;

describe("WaveformData Point object", function() {
  var instance;

  beforeEach(function() {
    const data = fixtures.getBinaryData({ channels: 1 });

    instance = new WaveformData(data);
  });

  it("should create a named point of data", function() {
    instance.set_point(1);
    instance.set_point(3, "sample");

    expect(Object.keys(instance.points)).to.have.lengthOf(2);
    expect(instance.points.default.timeStamp).to.equal(1);
    expect(instance.points.sample.timeStamp).to.equal(3);
  });

  it("should remove a named point of data", function() {
    instance.set_point(1);
    instance.set_point(2, "sample");

    expect(Object.keys(instance.points)).to.have.lengthOf(2);

    instance.remove_point("default");
    expect(Object.keys(instance.points)).to.have.lengthOf(1);
  });

  it("should remove a named point of data (false values)", function() {
    instance.set_point(0, 0);
    instance.set_point(1, "1");

    expect(Object.keys(instance.points)).to.have.lengthOf(2);

    instance.remove_point(0);

    expect(Object.keys(instance.points)).to.have.lengthOf(1);
    expect(instance.points["1"].timeStamp).to.equal(1);
  });

  it("should indicate if the point is visible in the offset", function() {
    instance.set_point(2);
    expect(instance.points.default.visible).to.be.true;

    instance.offset(2, 9);
    expect(instance.points.default.visible).to.be.true;

    instance.offset(3, 8);
    expect(instance.points.default.visible).to.be.false;
  });
});
