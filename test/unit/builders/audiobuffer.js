"use strict";

/* globals describe, it, beforeEach, DOMException, __dirname */

var fromAudioBuffer = require("../../../lib/builders/audiobuffer");
var AudioWaveform = require("../../../waveform-data");

var chai = require("chai");
var fs = require("fs");
var sinonChai = require("sinon-chai");
var expect = chai.expect;

chai.use(sinonChai);

describe("WaveformData AudioBuffer builder", function() {
  var sampleAudioBuffer;
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var audioContext = new AudioContext();

  beforeEach(function(done) {
    fs.readFile(__dirname + "/../../4channel.wav", function(err, buf) {
      audioContext.decodeAudioData(buf.buffer, (audioBuffer) => {
        sampleAudioBuffer = audioBuffer;
        done();
      });
    });
  });

  describe("factory", function() {
    it("should return a valid waveform in case of success", function(done) {
      var result = fromAudioBuffer(sampleAudioBuffer, function(err, waveform) {
        expect(err).to.not.be.ok;
        expect(waveform).to.be.an.instanceOf(AudioWaveform);
        expect(waveform).to.have.property("offset_length");

        // file length: 88200 samples
        // scale: 512 (default)
        // 88200 / 512 = 172, with 136 samples remaining, so 173 points total
        expect(waveform.offset_length).to.equal(173);
        done();
      });

      if (result && "then" in result) {
        result.catch(console.error.message);
      }
    });

    it("should adjust the length of the waveform when using a different scale", function(done) {
      var options = { scale: 128 };

      var result = fromAudioBuffer(sampleAudioBuffer, options, function(err, waveform) {
        expect(err).to.not.be.ok;
        expect(waveform).to.have.property("offset_length");

        // file length: 88200 samples
        // scale: 128
        // 88200 / 128 = 689, with 8 samples remaining, so 690 points total
        expect(waveform.offset_length).to.equal(690);
        done();
      });

      if (result && "then" in result) {
        result.catch(console.error.message);
      }
    });

    it("should return waveform data points", function(done) {
      var result = fromAudioBuffer(sampleAudioBuffer, function(err, waveform) {
        expect(err).to.not.be.ok;

        expect(waveform.min[0]).to.equal(-23);
        expect(waveform.max[0]).to.equal(22);

        expect(waveform.min[waveform.offset_length - 1]).to.equal(-23);
        expect(waveform.max[waveform.offset_length - 1]).to.equal(22);
        done();
      });

      if (result && "then" in result) {
        result.catch(console.error.message);
      }
    });

    it("should return correctly scaled waveform data points", function(done) {
      var options = { amplitude_scale: 2.0 };

      var result = fromAudioBuffer(sampleAudioBuffer, options, function(err, waveform) {
        expect(err).to.not.be.ok;

        expect(waveform.min[0]).to.equal(-45);
        expect(waveform.max[0]).to.equal(44);

        expect(waveform.min[waveform.offset_length - 1]).to.equal(-45);
        expect(waveform.max[waveform.offset_length - 1]).to.equal(44);
        done();
      });

      if (result && "then" in result) {
        result.catch(console.error.message);
      }
    });

    it("should return an error if the scale_adjuster parameter is present", function() {
      var options = { scale_adjuster: 127 };

      expect(function() {
        fromAudioBuffer(sampleAudioBuffer, options);
      }).to.throw(Error, /scale_adjuster/);
    });
  });
});
