import { getExpectedData, getBinaryData } from "../fixtures";

import { expect } from "chai";

export default function waveformDataTests(WaveformData, concatWaveformData) {
  describe("concatWaveformData()", function() {
    var expectations = getExpectedData();

    var waveforms = {
      8: {
        1: WaveformData.create(getBinaryData({ channels: 1, bits: 8 })),
        2: WaveformData.create(getBinaryData({ channels: 2, bits: 8 }))
      },
      16: {
        1: WaveformData.create(getBinaryData({ channels: 1, bits: 16 })),
        2: WaveformData.create(getBinaryData({ channels: 2, bits: 16 }))
      }
    };

    var waveformVersions = {
      1: WaveformData.create(getBinaryData({ channels: 1, bits: 8, version: 1 })),
      2: WaveformData.create(getBinaryData({ channels: 1, bits: 8, version: 2 }))
    };

    it("should concatenate two 8-bit mono waveforms", function() {
      var result = concatWaveformData(waveforms[8][1], waveforms[8][1]);

      expect(result).to.be.an.instanceOf(WaveformData);
      expect(result.channels).to.equal(1);
      expect(result.bits).to.equal(8);
      expect(result.length).to.equal(expectations.length * 2);
      expect(result.duration).to.equal(expectations.duration * 2);
      expect(result.channel(0).min_array()).to.deep.equal(
        [0, -10, 0, -5, -5, 0, 0, 0, 0, -2, 0, -10, 0, -5, -5, 0, 0, 0, 0, -2]
      );
    });

    it("should concatenate three 8-bit mono waveforms", function() {
      var result = concatWaveformData(waveforms[8][1], waveforms[8][1], waveforms[8][1]);

      expect(result).to.be.an.instanceOf(WaveformData);
      expect(result.channels).to.equal(1);
      expect(result.bits).to.equal(8);
      expect(result.length).to.equal(expectations.length * 3);
      expect(result.duration).to.equal(expectations.duration * 3);
      expect(result.channel(0).min_array()).to.deep.equal([
        0, -10, 0, -5, -5, 0, 0, 0, 0, -2,
        0, -10, 0, -5, -5, 0, 0, 0, 0, -2,
        0, -10, 0, -5, -5, 0, 0, 0, 0, -2
      ]);
    });

    it("should concatenate two 16-bit mono waveforms", function() {
      var result = concatWaveformData(waveforms[16][1], waveforms[16][1]);

      expect(result).to.be.an.instanceOf(WaveformData);
      expect(result.channels).to.equal(1);
      expect(result.bits).to.equal(16);
      expect(result.length).to.equal(expectations.length * 2);
      expect(result.duration).to.equal(expectations.duration * 2);
      expect(result.channel(0).min_array()).to.deep.equal(
        [0, -10, 0, -5, -5, 0, 0, 0, 0, -2, 0, -10, 0, -5, -5, 0, 0, 0, 0, -2]
      );
    });

    it("should concatenate two 8-bit stereo waveforms", function() {
      var result = concatWaveformData(waveforms[8][2], waveforms[8][2]);

      expect(result).to.be.an.instanceOf(WaveformData);
      expect(result.channels).to.equal(2);
      expect(result.bits).to.equal(8);
      expect(result.length).to.equal(expectations.length * 2);
      expect(result.duration).to.equal(expectations.duration * 2);
      expect(result.channel(0).min_array()).to.deep.equal(
        [0, -10, 0, -5, -5, 0, 0, 0, 0, -2, 0, -10, 0, -5, -5, 0, 0, 0, 0, -2]
      );
    });

    it("should concatenate two 16-bit stereo waveforms", function() {
      var result = concatWaveformData(waveforms[16][2], waveforms[16][2]);

      expect(result).to.be.an.instanceOf(WaveformData);
      expect(result.channels).to.equal(2);
      expect(result.bits).to.equal(16);
      expect(result.length).to.equal(expectations.length * 2);
      expect(result.duration).to.equal(expectations.duration * 2);
      expect(result.channel(0).min_array()).to.deep.equal(
        [0, -10, 0, -5, -5, 0, 0, 0, 0, -2, 0, -10, 0, -5, -5, 0, 0, 0, 0, -2]
      );
    });

    it("should throw an error if no waveforms are given", function() {
      expect(function() {
        concatWaveformData();
      }).to.throw(Error);
    });

    it("should throw an error given 8 and 16-bit mono waveforms", function() {
      expect(function() {
        concatWaveformData(waveforms[8][1], waveforms[16][1]);
      }).to.throw(Error);
    });

    it("should throw an error given 8 and 16-bit stereo waveforms", function() {
      expect(function() {
        concatWaveformData(waveforms[8][2], waveforms[16][2]);
      }).to.throw(Error);
    });

    it("should throw an error given mono and stereo 8-bit waveforms", function() {
      expect(function() {
        concatWaveformData(waveforms[8][1], waveforms[8][2]);
      }).to.throw(Error);
    });

    it("should throw an error given mono and stereo 16-bit waveforms", function() {
      expect(function() {
        concatWaveformData(waveforms[16][1], waveforms[16][2]);
      }).to.throw(Error);
    });

    it("should concatenate different version waveform data", function() {
      var result = concatWaveformData(waveformVersions[1], waveformVersions[2]);

      expect(result).to.be.an.instanceOf(WaveformData);
      expect(result.channels).to.equal(1);
      expect(result.bits).to.equal(8);
      expect(result.length).to.equal(expectations.length * 2);
      expect(result.duration).to.equal(expectations.duration * 2);
      expect(result.channel(0).min_array()).to.deep.equal(
        [0, -10, 0, -5, -5, 0, 0, 0, 0, -2, 0, -10, 0, -5, -5, 0, 0, 0, 0, -2]
      );
    });
  });
}
