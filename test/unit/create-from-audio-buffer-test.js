import { expect } from "chai";

export default function waveformDataAudioBufferTests(WaveformData, createWaveformDataFromAudioBuffer) {
  describe("createWaveformDataFromAudioBuffer", function() {
    var sampleAudioBuffer;
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    var audioContext = new AudioContext();

    beforeEach(function() {
      return fetch("/base/test/data/4channel.wav").then(function(response) {
        return response.arrayBuffer();
      })
      .then(function(buffer) {
        return audioContext.decodeAudioData(buffer);
      })
      .then(function(audioBuffer) {
        sampleAudioBuffer = audioBuffer;
      });
    });

    context("given an AudioBuffer", function() {
      it("should return a valid waveform", function(done) {
        createWaveformDataFromAudioBuffer(sampleAudioBuffer, {}, function(err, waveform) {
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
          disable_worker: true
        };

        createWaveformDataFromAudioBuffer(sampleAudioBuffer, options, function(err, waveform) {
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
          scale: 128
        };

        createWaveformDataFromAudioBuffer(sampleAudioBuffer, options, function(err, waveform) {
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

        createWaveformDataFromAudioBuffer(sampleAudioBuffer, {}, function(err, waveform) {
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
          amplitude_scale: 2.0
        };

        createWaveformDataFromAudioBuffer(sampleAudioBuffer, options, function(err, waveform) {
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
}
