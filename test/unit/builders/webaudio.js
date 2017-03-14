"use strict";

/* globals describe, it, beforeEach, afterEach */
// jshint -W030

var webaudioBuilder = require("../../../lib/builders/webaudio.js");
var AudioWaveform = require("../../../waveform-data.js");
var chai = require("chai");
var sinon = require("sinon");
var fs = require("fs");
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);

describe("WaveformData WebAudio builder", function(){
  var sandbox, audioDecoderStub, sampleBuffer;
  var Context = window.AudioContext || window.webkitAudioContext;
  var context = new Context();

  beforeEach(function(done){
    sandbox = sinon.sandbox.create();

    audioDecoderStub = sandbox.stub();

    fs.readFile(__dirname + '/../../4channel.wav', function(err, buf) {
      sampleBuffer = buf.buffer;
      done();
    });
  });

  afterEach(function(){
    sandbox.restore();
  });

  describe('Constructor', function(){
    it('should throw if audioContext is not the first argument', function() {
      expect(function(){
        webaudioBuilder(new ArrayBuffer(), sinon.spy());
      }).to.throw(/AudioContext/);
    });

    it('should return an error if the audio buffer is invalid', function(done) {
      webaudioBuilder(context, new ArrayBuffer(), function(err, waveform){
        if (err) {
          expect(err).to.have.property('code');
          expect(err).and.to.have.property('message').and.to.match(/Unable to decode audio data/);
        }
        // Safari and Firefox error style…
        // @see http://stackoverflow.com/q/10365335/103396
        else {
          expect(err).to.not.be.ok;
          expect(waveform).to.not.be.ok;
        }

        done();
      });
    });

    it('should return a valid waveform in case of success', function(done){
      var result = webaudioBuilder(context, sampleBuffer, function(err, waveform){
        expect(err).to.not.be.ok;
        expect(waveform).to.be.an.instanceOf(AudioWaveform);
        expect(waveform).to.have.property('offset_length');

        // file length: 88200 samples
        // scale: 512 (default)
        // 88200 / 512 = 172, with 136 samples remaining, so 173 points total
        expect(waveform.offset_length).to.equal(173);
        done();
      });

      if (result && 'then' in result) {
        result.catch(console.error.message);
      }
    });

    it('should adjust the length of the waveform when using a different scale', function(done){
      var options = { scale: 128 };

      var result = webaudioBuilder(new Context(), sampleBuffer, options, function(err, waveform){
        expect(err).to.not.be.ok;
        expect(waveform).to.have.property('offset_length');

        // file length: 88200 samples
        // scale: 128
        // 88200 / 128 = 689, with 8 samples remaining, so 690 points total
        expect(waveform.offset_length).to.equal(690);
        done();
      });

      if (result && 'then' in result) {
        result.catch(console.error.message);
      }
    });

    it('should return waveform data points', function(done) {
      var result = webaudioBuilder(new Context(), sampleBuffer, function(err, waveform) {
        expect(err).to.not.be.ok;

        expect(waveform.min[0]).to.equal(-23);
        expect(waveform.max[0]).to.equal(22);

        expect(waveform.min[waveform.offset_length - 1]).to.equal(-23);
        expect(waveform.max[waveform.offset_length - 1]).to.equal(22);
        done();
      });

      if (result && 'then' in result) {
        result.catch(console.error.message);
      }
    });

    it('should return correctly scaled waveform data points', function(done) {
      var options = { amplitude_scale: 2.0 };

      var result = webaudioBuilder(new Context(), sampleBuffer, options, function(err, waveform) {
        expect(err).to.not.be.ok;

        expect(waveform.min[0]).to.equal(-45);
        expect(waveform.max[0]).to.equal(44);

        expect(waveform.min[waveform.offset_length - 1]).to.equal(-45);
        expect(waveform.max[waveform.offset_length - 1]).to.equal(44);
        done();
      });

      if (result && 'then' in result) {
        result.catch(console.error.message);
      }
    });

    it('should return an error if the scale_adjuster parameter is present', function() {
      var options = { scale_adjuster: 127 };

      expect(function(){
        webaudioBuilder(new Context(), sampleBuffer, options);
      }).to.throw(Error, /scale_adjuster/);
    });
  });
});
