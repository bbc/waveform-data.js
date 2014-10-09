"use strict";

/* globals describe, it, beforeEach */
// jshint -W030

var rewire = require('rewire');
var WebaudioBuilder = rewire("../../../lib/builders/webaudio.js");
var getArrayBufferFakeData = require("../../fixtures").arraybuffer;
var chai = require("chai");
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);
var sinon = require('sinon');

describe("WaveformData WebAudio builder", function(){
  var sandbox, decodeAudioStub, audioDecoderStub;

  beforeEach(function(){
    sandbox = sinon.sandbox.create();

    audioDecoderStub = sandbox.stub();
    decodeAudioStub = sandbox.stub().returns(function(){});

    WebaudioBuilder.__set__('audioContext', { decodeAudioData: decodeAudioStub });
    WebaudioBuilder.__set__('audioDecoder', audioDecoderStub);
  });

  afterEach(function(){
    sandbox.restore();
  });

  describe('Constructor', function(){

    it('should pass the provided data to the audioContext.decodeAudio', function(){
      var dataArgSpy = sinon.spy();
      new WebaudioBuilder(dataArgSpy, sinon.spy());

      expect(decodeAudioStub).to.have.been.calledWith(dataArgSpy);
    });

    it('should call the built-in audioDecoder', function(){
      new WebaudioBuilder(new ArrayBuffer(), sinon.spy());

      expect(audioDecoderStub).to.have.been.calledOnce;
    });

    it('should call the build-in audioDecoder with default values', function(){
      new WebaudioBuilder(new ArrayBuffer(), sinon.spy());

      expect(audioDecoderStub.firstCall.args[0]).to.have.property('scale', 512);
      expect(audioDecoderStub.firstCall.args[0]).to.have.property('scale_adjuster', 127);
    });

    it('should call the build-in audioDecoder with an optional object', function(){
      var options = { scale: 128 }
      new WebaudioBuilder(new ArrayBuffer(), options, sinon.spy());

      expect(audioDecoderStub.firstCall.args[0]).to.have.property('scale', 128);
      expect(audioDecoderStub.firstCall.args[0]).to.have.property('scale_adjuster', 127);
    });

    it('should call the build-in audioDecoder with an undefined object', function(){
      new WebaudioBuilder(new ArrayBuffer(), undefined, sinon.spy());

      expect(audioDecoderStub.firstCall.args[0]).to.have.property('scale', 512);
      expect(audioDecoderStub.firstCall.args[0]).to.have.property('scale_adjuster', 127);
    });
  });

  describe('getAudioContext', function(){
    it('should return an instance of audioContext', function(){
      expect(WebaudioBuilder.getAudioContext()).to.have.property('decodeAudioData');
    });
  });
});