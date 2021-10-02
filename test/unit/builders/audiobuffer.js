"use strict";

/* globals context, describe, it, beforeEach, __dirname */

var WaveformData = require("../../../src/waveform-data");

var chai = require("chai");
var fs = require("fs");
var expect = chai.expect;

describe("WaveformData", function() {
  var sampleAudioBuffer;
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var audioContext = new AudioContext();

  beforeEach(function(done) {
    fs.readFile(__dirname + "/../../4channel.wav", function(err, buf) {
      audioContext.decodeAudioData(buf.buffer, function(audioBuffer) {
        sampleAudioBuffer = audioBuffer;
        done();
      });
    });
  });

  describe(".createFromAudio", function() {
    context("given an AudioBuffer", function() {
      it("should return a valid waveform", function(done) {
        var options = {
          audio_buffer: sampleAudioBuffer
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

      it("should return a valid waveform without using a worker", function(done) {
        var options = {
          audio_buffer: sampleAudioBuffer,
          disable_worker: true
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
          audio_buffer: sampleAudioBuffer,
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
          audio_buffer: sampleAudioBuffer
        };

        WaveformData.createFromAudio(options, function(err, waveform) {
          expect(err).to.not.be.ok;

          expect(waveform.channel(0).min_sample(0)).to.equal(-23);
          expect(waveform.channel(0).max_sample(0)).to.equal(22);

          expect(waveform.channel(0).min_sample(waveform.length - 1)).to.equal(-23);
          expect(waveform.channel(0).max_sample(waveform.length - 1)).to.equal(22);
          done();
        });
      });

      it("should return correctly scaled waveform data points", function(done) {
        var options = {
          audio_buffer: sampleAudioBuffer,
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
    });
  });
});
