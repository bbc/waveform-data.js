import { expect } from "chai";

export default function waveformDataAudioBufferTests(WaveformData) {
  describe("WaveformData", function() {
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

    describe(".createFromAudio", function() {
      context("given an AudioBuffer", function() {
        it("should return a valid waveform", function(done) {
          var options = {
            audio_buffer: sampleAudioBuffer,
            disable_worker: true
          };

          WaveformData.createFromAudio(options, function(err, waveform) {
            expect(err).to.not.be.ok;
            expect(waveform).to.be.an.instanceOf(WaveformData);
            expect(waveform.channels).to.equal(1);
            expect(waveform.bits).to.equal(8);

            // file length: 88200 samples
            // scale: 512 (default)
            // 88200 / 512 = 172, with 136 samples remaining, so 173 points total
            expect(waveform.length).to.equal(173);
            done();
          });
        });

        it("should return a valid waveform using a worker", function(done) {
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

        it("should adjust the length of the waveform when using a different scale", function(done) {
          var options = {
            audio_buffer: sampleAudioBuffer,
            scale: 128,
            disable_worker: true
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
            audio_buffer: sampleAudioBuffer,
            disable_worker: true
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
            amplitude_scale: 2.0,
            disable_worker: true
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
            audio_buffer: sampleAudioBuffer,
            split_channels: true,
            disable_worker: true
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

        it("should return 16-bit waveform data", function(done) {
          var options = {
            audio_buffer: sampleAudioBuffer,
            bits: 16,
            disable_worker: true
          };

          WaveformData.createFromAudio(options, function(err, waveform) {
            expect(err).to.not.be.ok;
            expect(waveform).to.be.an.instanceOf(WaveformData);
            expect(waveform.channels).to.equal(1);
            expect(waveform.bits).to.equal(16);

            // file length: 88200 samples
            // scale: 512 (default)
            // 88200 / 512 = 172, with 136 samples remaining, so 173 points total
            expect(waveform.length).to.equal(173);
            done();
          });
        });
      });
    });
  });
}
