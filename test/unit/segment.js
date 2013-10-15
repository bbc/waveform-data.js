"use strict";

/* globals describe, it, beforeEach */
// jshint -W030

var WaveformData = require("../../waveform-data.js");
var getArrayBufferFakeData = require("../fixtures").arraybuffer;
var expect = require("chai").expect;

describe("WaveformData Segment object", function(){
  var instance;

  beforeEach(function(){
    instance = new WaveformData(getArrayBufferFakeData(), WaveformData.adapters.arraybuffer);
  });

  it("should create a named segment of data.", function(){
    instance.set_segment(1, 6);
    instance.set_segment(3, 6, "snip");

    expect(Object.keys(instance.segments)).to.have.length.of(2);
    expect(instance.segments.default.start).to.equal(1);
    expect(instance.segments.default.end).to.equal(6);
  });

  it("should return an accurate initial length.", function (){
    instance.set_segment(3, 6);
    expect(instance.segments.default).to.have.length.of(3);
  });

  it("should return an accurate offset relative length.", function (){
    instance.set_segment(3, 6);
    expect(instance.segments.default.offset_length).to.equal(3);

    instance.offset(5, 9);
    expect(instance.segments.default.offset_length).to.equal(1);

    instance.offset(7, 8);
    expect(instance.segments.default.offset_length).to.equal(0);

    instance.offset(4, 5);
    expect(instance.segments.default.offset_length).to.equal(1);

    instance.offset(6, 10);
    expect(instance.segments.default.offset_length).to.equal(0);

    instance.offset(1, 3);
    expect(instance.segments.default.offset_length).to.equal(0);
  });

  it("should return an accurate offset relative start index.", function(){
    //tests below describe several use case
    //segment within a global offset (everything is displayed)
    //offset partially contains the segment
    //offset does not contain the segment
    //offset is contained in the segment
    instance.set_segment(3, 6);
    expect(instance.segments.default.offset_start).to.equal(3);

    instance.offset(5, 9);
    expect(instance.segments.default.offset_start).to.equal(5);

    instance.offset(7, 8);
    expect(instance.segments.default.offset_start).to.be.null;

    instance.offset(4, 5);
    expect(instance.segments.default.offset_start).to.equal(4);

    instance.offset(6, 10);
    expect(instance.segments.default.offset_start).to.be.null;

    instance.offset(1, 3);
    expect(instance.segments.default.offset_start).to.be.null;
  });

  it("should return an accurate offset relative end index.", function(){
    instance.set_segment(3, 6);
    expect(instance.segments.default.offset_end).to.equal(6);

    instance.offset(5, 9);
    expect(instance.segments.default.offset_end).to.equal(6);

    instance.offset(7, 8);
    expect(instance.segments.default.offset_end).to.be.null;
    instance.offset(4, 5);
    expect(instance.segments.default.offset_end).to.equal(5);

    instance.offset(6, 10);
    expect(instance.segments.default.offset_end).to.be.null;

    instance.offset(1, 3);
    expect(instance.segments.default.offset_end).to.be.null;
  });

  it("should return an accurate offset relative length.", function(){
    instance.set_segment(3, 6);
    expect(instance.segments.default.offset_length).to.equal(3);

    instance.offset(5, 9);
    expect(instance.segments.default.offset_length).to.equal(1);

    instance.offset(7, 8);
    expect(instance.segments.default.offset_length).to.equal(0);

    instance.offset(4, 5);
    expect(instance.segments.default.offset_length).to.equal(1);

    instance.offset(6, 10);
    expect(instance.segments.default.offset_length).to.equal(0);

    instance.offset(1, 3);
    expect(instance.segments.default.offset_length).to.equal(0);
  });

  it("should indicate if the segment is at least partially visible in the offset.", function(){
    instance.set_segment(3, 6);
    expect(instance.segments.default.visible).to.be.true;

    instance.offset(5, 9);
    expect(instance.segments.default.visible).to.be.true;

    instance.offset(7, 8);
    expect(instance.segments.default.visible).to.be.false;

    instance.offset(4, 5);
    expect(instance.segments.default.visible).to.be.true;
  });

  it("should return the minimum values visible in the offset.", function(){
    instance.set_segment(3, 6);
    expect(instance.segments.default.min).to.have.length.of(3);
    expect(instance.segments.default.min[0]).to.equal(instance.min_sample(3));
    expect(instance.segments.default.min[2]).to.equal(instance.min_sample(5));

    instance.offset(5, 9);
    expect(instance.segments.default.min).to.have.length.of(1);
    expect(instance.segments.default.min[0]).to.equal(instance.min_sample(5));

    instance.offset(7, 8);
    expect(instance.segments.default.min).to.be.empty;

    instance.offset(4, 5);
    expect(instance.segments.default.min).to.have.length.of(1);
    expect(instance.segments.default.min[0]).to.equal(instance.min_sample(4));
  });

  it("should return the maximum values visible in the offset.", function(){
    instance.set_segment(3, 6);
    expect(instance.segments.default.max[0]).to.equal(instance.max_sample(3));
    expect(instance.segments.default.max[2]).to.equal(instance.max_sample(5));

    instance.offset(5, 9);
    expect(instance.segments.default.max).to.have.length.of(1);
    expect(instance.segments.default.max[0]).to.equal(instance.max_sample(5));

    instance.offset(7, 8);
    expect(instance.segments.default.max).to.have.length.of(0);

    instance.offset(4, 5);
    expect(instance.segments.default.max).to.have.length.of(1);
    expect(instance.segments.default.max[0]).to.equal(instance.max_sample(4));
  });
});