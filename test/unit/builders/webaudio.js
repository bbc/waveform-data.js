"use strict";

/* globals describe, it, beforeEach, DOMException, __dirname */

var webAudioBuilder = require("../../../lib/builders/webaudio");
var AudioWaveform = require("../../../waveform-data");

var chai = require("chai");
var sinon = require("sinon");
var fs = require("fs");
var sinonChai = require("sinon-chai");
var expect = chai.expect;

chai.use(sinonChai);

describe("WaveformData WebAudio builder", function() {
  var sampleBuffer;
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var audioContext = new AudioContext();

  beforeEach(function(done) {
    fs.readFile(__dirname + "/../../4channel.wav", function(err, buf) {
      sampleBuffer = buf.buffer;
      done();
    });
  });

  describe("Constructor", function() {
    it("should throw if audioContext is not the first argument", function() {
      expect(function() {
        webAudioBuilder(new ArrayBuffer(), sinon.spy());
      }).to.throw(/AudioContext/);
    });

    it("should return an error if the audio buffer is invalid", function(done) {
      webAudioBuilder(audioContext, new ArrayBuffer(1024), function(err, waveform) {
        expect(err).to.be.an.instanceOf(DOMException);
        expect(waveform).to.not.be.ok;

        done();
      });
    });

    it("should return a valid waveform in case of success", function(done) {
      var result = webAudioBuilder(audioContext, sampleBuffer, function(err, waveform) {
        expect(err).to.not.be.ok;
        expect(waveform).to.be.an.instanceOf(AudioWaveform);
        expect(waveform.channels).to.equal(1);

        // file length: 88200 samples
        // scale: 512 (default)
        // 88200 / 512 = 172, with 136 samples remaining, so 173 points total
        expect(waveform.length).to.equal(173);
        done();
      });

      if (result && "then" in result) {
        result.catch(console.error.message);
      }
    });

    it("should adjust the length of the waveform when using a different scale", function(done) {
      var options = { scale: 128 };

      var result = webAudioBuilder(audioContext, sampleBuffer, options, function(err, waveform) {
        expect(err).to.not.be.ok;
        expect(waveform).to.be.an.instanceOf(AudioWaveform);
        expect(waveform).to.have.property("offset");
        expect(waveform.channels).to.equal(1);

        // file length: 88200 samples
        // scale: 128
        // 88200 / 128 = 689, with 8 samples remaining, so 690 points total
        expect(waveform.length).to.equal(690);
        done();
      });

      if (result && "then" in result) {
        result.catch(console.error.message);
      }
    });

    it("should return waveform data points", function(done) {
      var result = webAudioBuilder(audioContext, sampleBuffer, function(err, waveform) {
        expect(err).to.not.be.ok;

        expect(waveform.channels).to.equal(1);

        expect(waveform.channel(0).min_sample(0)).to.equal(-23);
        expect(waveform.channel(0).max_sample(0)).to.equal(22);

        expect(waveform.channel(0).min_sample(waveform.offset_length - 1)).to.equal(-23);
        expect(waveform.channel(0).max_sample(waveform.offset_length - 1)).to.equal(22);
        done();
      });

      if (result && "then" in result) {
        result.catch(console.error.message);
      }
    });

    it("should return correctly scaled waveform data points", function(done) {
      var options = { amplitude_scale: 2.0 };

      var result = webAudioBuilder(audioContext, sampleBuffer, options, function(err, waveform) {
        expect(err).to.not.be.ok;

        expect(waveform.channel(0).min_sample(0)).to.equal(-45);
        expect(waveform.channel(0).max_sample(0)).to.equal(44);

        expect(waveform.channel(0).min_sample(waveform.length - 1)).to.equal(-45);
        expect(waveform.channel(0).max_sample(waveform.length - 1)).to.equal(44);
        done();
      });

      if (result && "then" in result) {
        result.catch(console.error.message);
      }
    });

    it("should return multiple channels of waveform data points", function(done) {
      var options = { split_channels: true };

      var result = webAudioBuilder(audioContext, sampleBuffer, options, function(err, waveform) {
        expect(err).to.not.be.ok;

        expect(waveform.channels).to.equal(4);

        expect(waveform.channel(0).min_sample(0)).to.equal(-1);
        expect(waveform.channel(0).max_sample(0)).to.equal(0);

        expect(waveform.channel(1).min_sample(0)).to.equal(-1);
        expect(waveform.channel(1).max_sample(0)).to.equal(0);

        expect(waveform.channel(2).min_sample(0)).to.equal(-90);
        expect(waveform.channel(2).max_sample(0)).to.equal(89);

        expect(waveform.channel(3).min_sample(0)).to.equal(-1);
        expect(waveform.channel(3).max_sample(0)).to.equal(0);

        expect(waveform.channel(0).min_sample(waveform.length - 1)).to.equal(-1);
        expect(waveform.channel(0).max_sample(waveform.length - 1)).to.equal(0);

        expect(waveform.channel(1).min_sample(waveform.length - 1)).to.equal(-1);
        expect(waveform.channel(1).max_sample(waveform.length - 1)).to.equal(0);

        expect(waveform.channel(2).min_sample(waveform.length - 1)).to.equal(-90);
        expect(waveform.channel(2).max_sample(waveform.length - 1)).to.equal(89);

        expect(waveform.channel(3).min_sample(waveform.length - 1)).to.equal(-1);
        expect(waveform.channel(3).max_sample(waveform.length - 1)).to.equal(0);
        done();
      });

      if (result && "then" in result) {
        result.catch(console.error.message);
      }
    });

    it("should return an error if the scale_adjuster parameter is present", function() {
      var options = { scale_adjuster: 127 };

      expect(function() {
        webAudioBuilder(audioContext, sampleBuffer, options);
      }).to.throw(Error, /scale_adjuster/);
    });
  });
});
