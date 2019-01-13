"use strict";

/* globals context, describe, it, beforeEach, DOMException, __dirname */

var WaveformData = require("../../../waveform-data");

var chai = require("chai");
var sinon = require("sinon");
var fs = require("fs");
var sinonChai = require("sinon-chai");
var expect = chai.expect;

chai.use(sinonChai);

describe("WaveformData", function() {
  var sampleBuffer;
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var audioContext = new AudioContext();

  beforeEach(function(done) {
    fs.readFile(__dirname + "/../../4channel.wav", function(err, buf) {
      sampleBuffer = buf.buffer;
      done();
    });
  });

  describe(".createFromAudio", function() {
    it("should throw if an AudioContext is given as the first argument", function() {
      expect(function() {
        WaveformData.createFromAudio(audioContext, sinon.spy());
      }).to.throw(/AudioContext/);
    });

    context("given an AudioContext and ArrayBuffer", function() {
      it("should return an error if the audio buffer is invalid", function(done) {
        var options = {
          audio_context: audioContext,
          array_buffer: new ArrayBuffer(1024)
        };

        WaveformData.createFromAudio(options, function(err, waveform) {
          expect(err).to.be.an.instanceOf(DOMException);
          expect(waveform).to.not.be.ok;

          done();
        });
      });

      it("should return a valid waveform in case of success", function(done) {
        var options = {
          audio_context: audioContext,
          array_buffer: sampleBuffer
        };

        WaveformData.createFromAudio(options, function(err, waveform) {
          expect(err).to.not.be.ok;
          expect(waveform).to.be.an.instanceOf(WaveformData);
          expect(waveform.channels).to.equal(1);

          // file length: 88200 samples
          // scale: 512 (default)
          // 88200 / 512 = 172, with 136 samples remaining, so 173 points total
          expect(waveform.length).to.equal(173);
          done();
        });
      });

      it("should adjust the length of the waveform when using a different scale", function(done) {
        var options = {
          audio_context: audioContext,
          array_buffer: sampleBuffer,
          scale: 128
        };

        WaveformData.createFromAudio(options, function(err, waveform) {
          expect(err).to.not.be.ok;
          expect(waveform).to.be.an.instanceOf(WaveformData);
          expect(waveform.channels).to.equal(1);

          // file length: 88200 samples
          // scale: 128
          // 88200 / 128 = 689, with 8 samples remaining, so 690 points total
          expect(waveform.length).to.equal(690);
          done();
        });
      });

      it("should return waveform data points", function(done) {
        var options = {
          audio_context: audioContext,
          array_buffer: sampleBuffer
        };

        WaveformData.createFromAudio(options, function(err, waveform) {
          expect(err).to.not.be.ok;

          expect(waveform.channels).to.equal(1);

          expect(waveform.channel(0).min_sample(0)).to.equal(-23);
          expect(waveform.channel(0).max_sample(0)).to.equal(22);

          expect(waveform.channel(0).min_sample(waveform.length - 1)).to.equal(-23);
          expect(waveform.channel(0).max_sample(waveform.length - 1)).to.equal(22);
          done();
        });
      });

      it("should return correctly scaled waveform data points", function(done) {
        var options = {
          audio_context: audioContext,
          array_buffer: sampleBuffer,
          amplitude_scale: 2.0
        };

        WaveformData.createFromAudio(options, function(err, waveform) {
          expect(err).to.not.be.ok;

          expect(waveform.channel(0).min_sample(0)).to.equal(-45);
          expect(waveform.channel(0).max_sample(0)).to.equal(44);

          expect(waveform.channel(0).min_sample(waveform.length - 1)).to.equal(-45);
          expect(waveform.channel(0).max_sample(waveform.length - 1)).to.equal(44);
          done();
        });
      });

      it("should return multiple channels of waveform data points", function(done) {
        var options = {
          audio_context: audioContext,
          array_buffer: sampleBuffer,
          split_channels: true
        };

        WaveformData.createFromAudio(options, function(err, waveform) {
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
      });

      it("should return an error if the scale_adjuster parameter is present", function() {
        var options = {
          audio_context: audioContext,
          array_buffer: sampleBuffer,
          scale_adjuster: 127
        };

        expect(function() {
          WaveformData.createFromAudio(options);
        }).to.throw(Error, /scale_adjuster/);
      });
    });
  });
});
