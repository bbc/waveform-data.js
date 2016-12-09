"use strict";

/* globals describe, it, beforeEach */
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
  var audioContext = window.AudioContext || window.webkitAudioContext;
  var context = new audioContext;

  beforeEach(function(done){
    sandbox = sinon.sandbox.create();

    audioDecoderStub = sandbox.stub();

    fs.readFile(__dirname + '/../../silence.mp3', function(err, buf) {
      sampleBuffer = buf.buffer;
      done();
    });
  });

  afterEach(function(){
    sandbox.restore();
  });

  describe('Constructor', function(){
    it('should explicitely fail if audioContext is not the first argument', function () {
      expect(function(){
        webaudioBuilder(new ArrayBuffer(), sinon.spy());
      }).to.throw(/AudioContext/);
    });

    it('should raise an error in case audio buffer is invalid', function(done){
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
      webaudioBuilder(context, sampleBuffer, function(err, waveform){
        expect(err).to.not.be.ok;
        expect(waveform).to.be.an.instanceOf(AudioWaveform);

        done();
      });
    });

    it('should adjust the length of the waveform when using a different scale', function(done){
      var options = { scale: 128 };

      webaudioBuilder(new audioContext, sampleBuffer, options, function(err, waveform){
        expect(err).to.not.be.ok;
        expect(waveform).to.have.property('offset_length').and.to.be.closeTo(360, 15);

        done();
      });

    });

  });

});
