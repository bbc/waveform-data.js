import { getExpectedData, getJSONData, getBinaryData } from "../fixtures";

import { expect } from "chai";

export default function resampleWaveformDataTests(WaveformData, resampleWaveformData) {
  describe("resampleWaveformData()", function() {
    var instance;
    var expectations = getExpectedData();

    context("given single channel waveform data", function() {
      ["binary", "json"].forEach(function(format) {
        [8, 16].forEach(function(bits) {
          context("with " + bits + "-bit " + format + " data", function() {
            beforeEach(function() {
              const data = format === "binary" ? getBinaryData({ channels: 1, bits: bits })
                                              : getJSONData({ channels: 1, bits: bits });

              instance = WaveformData.create(data);
            });

            it("should throw an error if the width is larger than the waveform length", function() {
              expect(function() {
                resampleWaveformData(instance, { width: 11 });
              }).to.throw(Error);
            });

            it("should throw an error if the scale value is not a positive integer", function() {
              expect(function() {
                resampleWaveformData(instance, { scale: 0 });
              }).to.throw(RangeError);
            });

            it("should throw an error if the width value is not a positive integer", function() {
              expect(function() {
                resampleWaveformData(instance, { width: 0 });
              }).to.throw(RangeError);
            });

            it("should throw an error if the options object is missing", function() {
              expect(function() {
                resampleWaveformData(instance);
              }).to.throw(Error, /Missing/);
            });

            it("should throw an error if both width and scale are missing", function() {
              expect(function() {
                resampleWaveformData(instance, {});
              }).to.throw(Error, /Missing/);
            });

            describe("full resample by width", function() {
              it("should resample to 5 elements if a width of 5 is requested", function() {
                const resampled = resampleWaveformData(instance, { width: 5 });

                expect(resampled).to.be.an.instanceOf(WaveformData);
                expect(resampled.length).to.equal(5);
                expect(resampled.sample_rate).to.equal(instance.sample_rate);
                expect(resampled.channels).to.equal(instance.channels);
                expect(resampled.bits).to.equal(instance.bits);
                // Resampling updates the waveform data header version
                expect(resampled._version()).to.equal(2);
              });
            });

            // if we double the scale, it should fit in half the previous size (which means 5px)
            describe("resample with given scale", function() {
              it("should return a waveform with half the number of points", function() {
                expect(resampleWaveformData(instance, { scale: 1024 }).length)
                  .to.equal(expectations.resampled_length);
              });

              it("should return a waveform with half the duration", function() {
                expect(resampleWaveformData(instance, { scale: 1024 }).duration)
                  .to.equal(expectations.duration);
              });

              it("should return expected waveform data values", function() {
                var resampled = resampleWaveformData(instance, { scale: 1024 });

                expect(resampled.channel(0).min_array())
                  .to.deep.equal(expectations.resampled_values.channels[0].min);
                expect(resampled.channel(0).max_array())
                  .to.deep.equal(expectations.resampled_values.channels[0].max);
              });
            });
          });
        });
      });
    });

    context("given two-channel waveform data", function() {
      ["binary", "json"].forEach(function(format) {
        [8, 16].forEach(function(bits) {
          context("with " + bits + "-bit " + format + " data", function() {
            beforeEach(function() {
              const data = format === "binary" ? getBinaryData({ channels: 2, bits: bits })
                                              : getJSONData({ channels: 2, bits: bits });

              instance = WaveformData.create(data);
            });

            it("should throw an error if the width is larger than the waveform length", function() {
              expect(function() {
                resampleWaveformData(instance, { width: 11 });
              }).to.throw(Error);
            });

            it("should throw an error if the width is not a number", function() {
              expect(function() {
                resampleWaveformData(instance, { width: "5" });
              }).to.throw(Error);
            });

            it("should throw an error if the width value is not a positive integer", function() {
              expect(function() {
                resampleWaveformData(instance, { width: 0 });
              }).to.throw(RangeError);
            });

            it("should throw an error if the scale value is not a number", function() {
              expect(function() {
                resampleWaveformData(instance, { scale: "1024" });
              }).to.throw(RangeError);
            });

            it("should throw an error if the scale value is not a positive integer", function() {
              expect(function() {
                resampleWaveformData(instance, { scale: 0 });
              }).to.throw(RangeError);
            });

            it("should throw an error if the options object is missing", function() {
              expect(function() {
                resampleWaveformData(instance);
              }).to.throw(Error, /Missing/);
            });

            it("should throw an error if both width and scale are missing", function() {
              expect(function() {
                resampleWaveformData(instance, {});
              }).to.throw(Error, /Missing/);
            });

            describe("full resample by width", function() {
              it("should resample to the given width", function() {
                expect(resampleWaveformData(instance, { width: 5 })).to.have.a.lengthOf(5);
              });

              it("should return the correct duration", function() {
                expect(resampleWaveformData(instance, { width: 5 }).duration).equal(expectations.duration);
              });

              it("should contain the same number of channels", function() {
                expect(resampleWaveformData(instance, { width: 5 }).channels).to.equal(2);
              });
            });

            // if we double the scale, it should fit in half the previous size (which means 5px)
            describe("full resample by scale", function() {
              it("should return a waveform with half the number of points", function() {
                expect(resampleWaveformData(instance, { scale: 1024 }))
                  .to.have.lengthOf(expectations.resampled_length);
              });

              it("should return a waveform with half the duration", function() {
                expect(resampleWaveformData(instance, { scale: 1024 }))
                  .to.have.property("duration", expectations.duration);
              });

              it("should resample to a set of expected values", function() {
                var resampled = resampleWaveformData(instance, { scale: 1024 });

                expect(resampled.channel(0).min_array())
                  .to.deep.equal(expectations.resampled_values.channels[0].min);
                expect(resampled.channel(0).max_array())
                  .to.deep.equal(expectations.resampled_values.channels[0].max);

                expect(resampled.channel(1).min_array())
                  .to.deep.equal(expectations.resampled_values.channels[1].min);
                expect(resampled.channel(1).max_array())
                  .to.deep.equal(expectations.resampled_values.channels[1].max);
              });
            });
          });
        });
      });
    });
  });
}
