import { getExpectedData, getJSONData, getBinaryData } from "../fixtures";

import { expect } from "chai";

export default function waveformDataTests(WaveformData) {
  describe("WaveformData", function() {
    var instance;
    var expectations = getExpectedData();

    describe(".create", function() {
      it("should not build an instance for an unknown data type", function() {
        expect(function() {
          WaveformData.create(0);
        }).to.throw(/Unknown data format/);

        expect(function() {
          WaveformData.create(null);
        }).to.throw(/Unknown data format/);
      });

      it("should not create from a JSON string", function() {
        const data = getJSONData({ channels: 1 });

        expect(function() {
          WaveformData.create(JSON.stringify(data));
        }).to.throw(/Unknown data format/);
      });

      it("should create from a JavaScript object", function() {
        const data = getJSONData({ channels: 1 });

        expect(WaveformData.create(data))
          .to.be.an.instanceOf(WaveformData);
      });

      it("should create from an ArrayBuffer containing binary waveform data", function() {
        const data = getBinaryData({ channels: 2 });

        expect(WaveformData.create(data))
          .to.be.an.instanceOf(WaveformData);
      });

      it("should not build an instance for an unknown version", function() {
        const data = getBinaryData({ version: 4 });

        expect(function() {
          WaveformData.create(data);
        }).to.throw(Error);
      });
    });

    context("given single channel waveform data", function() {
      ["binary", "json"].forEach(function(format) {
        [8, 16].forEach(function(bits) {
          context("with " + bits + "-bit " + format + " data", function() {
            beforeEach(function() {
              const data = format === "binary" ? getBinaryData({ channels: 1, bits: bits })
                                               : getJSONData({ channels: 1, bits: bits });

              instance = WaveformData.create(data);
            });

            describe(".bits", function() {
              it("should return the number of bits per sample", function() {
                expect(instance.bits).to.equal(bits);
              });
            });

            describe(".channels", function() {
              it("should return the number of channels", function() {
                expect(instance.channels).to.equal(1);
              });
            });

            describe(".channel", function() {
              it("should return a channel object", function() {
                expect(instance.channel(0)).to.be.ok;
              });

              it("should throw when given an invalid channel index", function() {
                expect(function() {
                  instance.channel(1);
                }).to.throw(RangeError);

                expect(function() {
                  instance.channel(-1);
                }).to.throw(RangeError);
              });
            });

            describe("WaveformDataChannel", function() {
              describe(".min_array()", function() {
                it("should return an array containing the waveform minimum values", function() {
                  expect(instance.channel(0).min_array())
                    .to.deep.equal([0, -10, 0, -5, -5, 0, 0, 0, 0, -2]);
                });
              });

              describe(".max_array()", function() {
                it("should return an array containing the waveform maximum values", function() {
                  expect(instance.channel(0).max_array())
                    .to.deep.equal([0, 10, 0, 7, 7, 0, 0, 0, 0, 2]);
                });
              });

              describe(".min_sample()", function() {
                it("should return the correct minimum waveform value for a given index", function() {
                  expect(instance.channel(0).min_sample(0)).to.equal(0);
                  expect(instance.channel(0).min_sample(4)).to.equal(-5);
                  expect(instance.channel(0).min_sample(9)).to.equal(-2);
                });

                it("should throw on indexing beyond the length of the data", function() {
                  expect(function() {
                    instance.channel(0).min_sample(10);
                  }).to.throw(RangeError);
                });
              });

              describe(".max_sample()", function() {
                it("should return the correct maximum waveform value for a given index", function() {
                  expect(instance.channel(0).max_sample(0)).to.equal(0);
                  expect(instance.channel(0).max_sample(4)).to.equal(7);
                  expect(instance.channel(0).max_sample(9)).to.equal(2);
                });

                it("should throw on indexing beyond the length of the data", function() {
                  expect(function() {
                    instance.channel(0).max_sample(10);
                  }).to.throw(RangeError);
                });
              });
            });

            describe(".length", function() {
              it("should return the length of the waveform", function() {
                expect(instance.length).to.equal(expectations.length);
              });
            });

            describe(".duration", function() {
              it("should return the duration waveform, in seconds", function() {
                expect(instance.duration).to.equal(expectations.duration);
              });
            });

            describe(".sample_rate", function() {
              it("should return the sample rate, in Hertz", function() {
                expect(instance.sample_rate).to.equal(48000);
              });
            });

            describe(".scale", function() {
              it("should return the waveform scale, in samples per pixel", function() {
                expect(instance.scale).to.equal(512);
              });
            });

            describe(".pixels_per_second", function() {
              it("should compute the number of pixels per seconds for this set of data", function() {
                expect(instance.pixels_per_second).to.equal(93.75); // 48000 / 512
              });
            });

            describe(".seconds_per_pixel", function() {
              it("should compute the number of seconds per pixel for this set of data", function() {
                expect(instance.seconds_per_pixel).to.equal(0.010666666666666666); // 512 / 48000
              });
            });

            describe(".resample()", function() {
              it("should throw an error if the scale value is not a positive integer", function() {
                expect(function() {
                  instance.resample({ scale: 0 });
                }).to.throw(RangeError);
              });

              it("should throw an error if the scale value is not a number", function() {
                expect(function() {
                  instance.resample({ scale: "1024" });
                }).to.throw(RangeError);
              });

              it("should throw an error if the width value is not a positive integer", function() {
                expect(function() {
                  instance.resample({ width: 0 });
                }).to.throw(RangeError);
              });

              it("should throw an error if the width is not a number", function() {
                expect(function() {
                  instance.resample({ width: "5" });
                }).to.throw(Error);
              });

              it("should throw an error if both width and scale are missing", function() {
                expect(function() {
                  instance.resample({});
                }).to.throw(Error, /Missing/);
              });

              it("should throw an error if start time is negative", function() {
                expect(function() {
                  instance.resample({ startTime: -1.0, endTime: 10.0, width: 500 });
                }).to.throw(RangeError);
              });

              it("should throw an error if end time is less than start time", function() {
                expect(function() {
                  instance.resample({ startTime: 11.0, endTime: 10.0, width: 500 });
                }).to.throw(RangeError);
              });

              it("should throw an error if start time is given without width option", function() {
                expect(function() {
                  instance.resample({ startTime: 11.0, endTime: 10.0 });
                }).to.throw(Error);
              });

              it("should throw an error if end time is given without width option", function() {
                expect(function() {
                  instance.resample({ endTime: 10.0 });
                }).to.throw(Error);
              });

              describe("full resample by width", function() {
                it("should resample to 5 elements if a width of 5 is requested", function() {
                  const resampled = instance.resample({ width: 5 });

                  expect(resampled).to.be.an.instanceOf(WaveformData);
                  expect(resampled.length).to.equal(5);
                  expect(resampled.sample_rate).to.equal(instance.sample_rate);
                  expect(resampled.channels).to.equal(instance.channels);
                  expect(resampled.bits).to.equal(instance.bits);

                  // Resampling updates the waveform data header version
                  expect(resampled._version()).to.equal(3);
                });

                it("should stretch the waveform if the width is larger than the waveform length", function() {
                  const resampled = instance.resample({ width: 20 });

                  expect(resampled).to.be.an.instanceOf(WaveformData);
                  expect(resampled.length).to.equal(20);
                  expect(resampled.sample_rate).to.equal(instance.sample_rate);
                  expect(resampled.channels).to.equal(instance.channels);
                  expect(resampled.bits).to.equal(instance.bits);

                  for (var i = 0; i < 20; i++) {
                    var index = Math.floor(i / 2);

                    expect(resampled.channel(0).min_sample(i))
                      .to.equal(instance.channel(0).min_sample(index));

                    expect(resampled.channel(0).max_sample(i))
                      .to.equal(instance.channel(0).max_sample(index));
                  }

                  // Resampling updates the waveform data header version
                  expect(resampled._version()).to.equal(3);
                });
              });

              // if we double the scale, it should fit in half the previous size (which means 5px)
              describe("resample with given scale", function() {
                it("should return a waveform with half the number of points", function() {
                  expect(instance.resample({ scale: 1024 }).length)
                    .to.equal(expectations.resampled_length);
                });

                it("should return a waveform with half the duration", function() {
                  expect(instance.resample({ scale: 1024 }).duration)
                    .to.equal(expectations.duration);
                });

                it("should return expected waveform data values", function() {
                  var resampled = instance.resample({ scale: 1024 });

                  expect(resampled.channel(0).min_array())
                    .to.deep.equal(expectations.resampled_values.channels[0].min);
                  expect(resampled.channel(0).max_array())
                    .to.deep.equal(expectations.resampled_values.channels[0].max);
                });
              });
            });

            describe(".concat()", function() {
              var binaryWaveform, jsonWaveform;

              beforeEach(function() {
                binaryWaveform = WaveformData.create(getBinaryData({ channels: 1 }));
                jsonWaveform = WaveformData.create(getJSONData({ channels: 1 }));
              });

              it("should concatenate with binary data", function() {
                var result = binaryWaveform.concat(binaryWaveform);

                expect(result).to.be.an.instanceOf(WaveformData);
                expect(result.channels).to.equal(1);
                expect(result.length).to.equal(expectations.length * 2);
                expect(result.duration).to.equal(expectations.duration * 2);
                expect(result.channel(0).min_array()).to.deep.equal(
                  [0, -10, 0, -5, -5, 0, 0, 0, 0, -2, 0, -10, 0, -5, -5, 0, 0, 0, 0, -2]
                );
              });

              it("should concatenate with JSON data", function() {
                var result = jsonWaveform.concat(jsonWaveform);

                expect(result).to.be.an.instanceOf(WaveformData);
                expect(result.channels).to.equal(1);
                expect(result.length).to.equal(expectations.length * 2);
                expect(result.duration).to.equal(expectations.duration * 2);
                expect(result.channel(0).min_array()).to.deep.equal(
                  [0, -10, 0, -5, -5, 0, 0, 0, 0, -2, 0, -10, 0, -5, -5, 0, 0, 0, 0, -2]
                );
              });

              it("should throw an error given incompatible adapters", function() {
                expect(function() {
                  binaryWaveform.append(jsonWaveform);
                }).to.throw(Error);
              });

              it("should throw an error given incompatible audio", function() {
                expect(function() {
                  var stereoWaveform = WaveformData.create(getBinaryData({ channels: 2 }));

                  binaryWaveform.concat(stereoWaveform);
                }).to.throw(Error);
              });

              it("should append multiple WaveformData instances", function() {
                var result = binaryWaveform.concat(binaryWaveform, binaryWaveform);

                expect(result.channels).to.equal(1);
                expect(result.length).to.equal(expectations.length * 3);
                expect(result.duration).to.equal(expectations.duration * 3);
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

            describe(".bits", function() {
              it("should return the number of bits per sample", function() {
                expect(instance.bits).to.equal(bits);
              });
            });

            describe(".channels", function() {
              it("should return the correct number of channels", function() {
                expect(instance.channels).to.equal(2);
              });
            });

            describe(".channel", function() {
              it("should return a channel object", function() {
                expect(instance.channel(0)).to.be.ok;
                expect(instance.channel(1)).to.be.ok;
              });

              it("should throw when given an invalid channel index", function() {
                expect(function() {
                  instance.channel(2);
                }).to.throw(RangeError);

                expect(function() {
                  instance.channel(-1);
                }).to.throw(RangeError);
              });

              describe("WaveformDataChannel", function() {
                describe(".min_array()", function() {
                  it("should return an array containing the waveform minimum values", function() {
                    expect(instance.channel(0).min_array())
                      .to.deep.equal([0, -10, 0, -5, -5, 0, 0, 0, 0, -2]);
                    expect(instance.channel(1).min_array())
                      .to.deep.equal([0, -8, -2, -6, -6, 0, 0, 0, 0, -3]);
                  });
                });

                describe(".max_array()", function() {
                  it("should return an array containing the waveform maximum values", function() {
                    expect(instance.channel(0).max_array())
                      .to.deep.equal([0, 10, 0, 7, 7, 0, 0, 0, 0, 2]);
                    expect(instance.channel(1).max_array())
                      .to.deep.equal([0, 8, 2, 3, 3, 0, 0, 0, 0, 3]);
                  });
                });

                describe(".min_sample()", function() {
                  it("should return the proper minimum value for a given pixel index", function() {
                    expect(instance.channel(0).min_sample(0)).to.equal(0);
                    expect(instance.channel(0).min_sample(4)).to.equal(-5);
                    expect(instance.channel(0).min_sample(9)).to.equal(-2);

                    expect(instance.channel(1).min_sample(0)).to.equal(0);
                    expect(instance.channel(1).min_sample(4)).to.equal(-6);
                    expect(instance.channel(1).min_sample(9)).to.equal(-3);
                  });

                  it("should throw on indexing beyond the length of the data", function() {
                    expect(function() {
                      instance.channel(0).min_sample(10);
                    }).to.throw(RangeError);
                  });
                });

                describe(".max_sample()", function() {
                  it("should return the proper maximum value for a given pixel index", function() {
                    expect(instance.channel(0).max_sample(0)).to.equal(0);
                    expect(instance.channel(0).max_sample(4)).to.equal(7);
                    expect(instance.channel(0).max_sample(9)).to.equal(2);

                    expect(instance.channel(1).max_sample(0)).to.equal(0);
                    expect(instance.channel(1).max_sample(4)).to.equal(3);
                    expect(instance.channel(1).max_sample(9)).to.equal(3);
                  });

                  it("should throw on indexing beyond the length of the data", function() {
                    expect(function() {
                      instance.channel(0).max_sample(10);
                    }).to.throw(RangeError);
                  });
                });
              });
            });

            describe(".length", function() {
              it("should return the length of the waveform", function() {
                expect(instance.length).to.equal(expectations.length);
              });
            });

            describe(".duration", function() {
              it("should return the duration of the media when no offset is set", function() {
                expect(instance.duration).to.equal(expectations.duration);
              });
            });

            describe(".sample_rate", function() {
              it("should return the sample rate, in Hertz", function() {
                expect(instance.sample_rate).to.equal(48000);
              });
            });

            describe(".scale", function() {
              it("should return the waveform scale, in samples per pixel", function() {
                expect(instance.scale).to.equal(512);
              });
            });

            describe(".pixels_per_second", function() {
              it("should compute the number of pixels per seconds for this set of data", function() {
                expect(instance.pixels_per_second).to.equal(93.75);   // 48000 / 512
              });
            });

            describe(".seconds_per_pixel", function() {
              it("should compute the number of seconds per pixel for this set of data", function() {
                expect(instance.seconds_per_pixel).to.equal(0.010666666666666666);    // 512 / 48000
              });
            });

            describe(".resample()", function() {
              it("should throw an error if the scale value is not a positive integer", function() {
                expect(function() {
                  instance.resample({ scale: 0 });
                }).to.throw(RangeError);
              });

              it("should throw an error if the scale value is not a number", function() {
                expect(function() {
                  instance.resample({ scale: "1024" });
                }).to.throw(RangeError);
              });

              it("should throw an error if the width value is not a positive integer", function() {
                expect(function() {
                  instance.resample({ width: 0 });
                }).to.throw(RangeError);
              });

              it("should throw an error if the width is not a number", function() {
                expect(function() {
                  instance.resample({ width: "5" });
                }).to.throw(Error);
              });

              it("should throw an error if both width and scale are missing", function() {
                expect(function() {
                  instance.resample({});
                }).to.throw(Error, /Missing/);
              });

              it("should throw an error if start time is negative", function() {
                expect(function() {
                  instance.resample({ startTime: -1.0, endTime: 10.0, width: 500 });
                }).to.throw(RangeError);
              });

              it("should throw an error if end time is less than start time", function() {
                expect(function() {
                  instance.resample({ startTime: 11.0, endTime: 10.0, width: 500 });
                }).to.throw(RangeError);
              });

              it("should throw an error if start time is given without width option", function() {
                expect(function() {
                  instance.resample({ startTime: 11.0, endTime: 10.0 });
                }).to.throw(Error);
              });

              it("should throw an error if end time is given without width option", function() {
                expect(function() {
                  instance.resample({ endTime: 10.0 });
                }).to.throw(Error);
              });

              describe("full resample by width", function() {
                it("should resample to the given width", function() {
                  expect(instance.resample({ width: 5 })).to.have.a.lengthOf(5);
                });

                it("should return the correct duration", function() {
                  expect(instance.resample({ width: 5 }).duration).equal(expectations.duration);
                });

                it("should contain the same number of channels", function() {
                  expect(instance.resample({ width: 5 }).channels).to.equal(2);
                });
              });

              // if we double the scale, it should fit in half the previous size (which means 5px)
              describe("full resample by scale", function() {
                it("should return a waveform with half the number of points", function() {
                  expect(instance.resample({ scale: 1024 }))
                    .to.have.lengthOf(expectations.resampled_length);
                });

                it("should return a waveform with half the duration", function() {
                  expect(instance.resample({ scale: 1024 }))
                    .to.have.property("duration", expectations.duration);
                });

                it("should resample to a set of expected values", function() {
                  var resampled = instance.resample({ scale: 1024 });

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

            describe(".concat()", function() {
              var binaryWaveform, jsonWaveform;

              beforeEach(function() {
                binaryWaveform = WaveformData.create(getBinaryData({ channels: 2 }));
                jsonWaveform = WaveformData.create(getJSONData({ channels: 2 }));
              });

              it("should return a new object with the concatenated result", function() {
                var result = binaryWaveform.concat(jsonWaveform);

                expect(result.channels).to.equal(2);
                expect(result.length).to.equal(expectations.length * 2);
                expect(result.duration).to.equal(expectations.duration * 2);
                expect(result.channel(0).min_array()).to.deep.equal(
                  [0, -10, 0, -5, -5, 0, 0, 0, 0, -2, 0, -10, 0, -5, -5, 0, 0, 0, 0, -2]
                );
              });

              it("throws an error if passing incompatible audio", function() {
                expect(function() {
                  let stereoWaveform = WaveformData.create(getBinaryData({ channels: 1 }));

                  binaryWaveform.concat(stereoWaveform);
                }).to.throw(Error);
              });

              it("can append multiple WaveformDatas at once", function() {
                var result = binaryWaveform.concat(binaryWaveform, jsonWaveform);

                expect(result.channels).to.equal(2);
                expect(result.length).to.equal(expectations.length * 3);
                expect(result.duration).to.equal(expectations.duration * 3);
              });
            });
          });
        });
      });
    });

    describe(".at_time()", function() {
      it("should compute a location in pixel of 0 if the time is 0 seconds", function() {
        expect(instance.at_time(0)).to.equal(0);
      });

      it("should compute a location in pixel of 14 if the time is 0.15 seconds", function() {
        // floor 0.15 * 48000 / 512 (pixels_per_second)
        expect(instance.at_time(0.15)).to.equal(14);
      });

      it("should compute a location in pixel of 93 if the time is 1 second", function() {
        // floor 1 * 48000 / 512 (pixels_per_second)
        expect(instance.at_time(1)).to.equal(93);
      });

      it("should convert between pixel indexes and times without losing precision", function() {
        expect(instance.at_time(instance.time(0))).to.equal(0);
        expect(instance.at_time(instance.time(14))).to.equal(14);
        expect(instance.at_time(instance.time(93))).to.equal(93);
      });
    });

    describe(".time()", function() {
      it("should return a time of 0 seconds for a given pixel index of 0", function() {
        expect(instance.time(0)).to.equal(0);
      });

      it("should return the time in seconds for a given pixel index of 0.15", function() {
        expect(instance.time(0.15)).to.equal(0.0015999999999999999); // 0.15 * 512 / 48000
      });

      it("should return the time in seconds for a given pixel index of 1", function() {
        expect(instance.time(1)).to.equal(0.010666666666666666); // 1 * 512 / 48000
      });
    });

    describe(".toJSON()", function() {
      beforeEach(function() {
        var data = getBinaryData({ channels: 2 });

        instance = WaveformData.create(data);
      });

      it("should return a JavaScript object containing the waveform data", function() {
        expect(instance.toJSON()).to.deep.equal({
          version: 2,
          channels: 2,
          sample_rate: 48000,
          samples_per_pixel: 512,
          bits: 8,
          length: 10,
          data: [
            0, 0, 0, 0,
            -10, 10, -8, 8,
            0, 0, -2, 2,
            -5, 7, -6, 3,
            -5, 7, -6, 3,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            -2, 2, -3, 3
          ]
        });
      });

      it("should allow a WaveformData instance to be stringified as JSON", function() {
        expect(JSON.stringify(instance)).to.equal(
          "{\"version\":2,\"channels\":2,\"sample_rate\":48000," +
          "\"samples_per_pixel\":512,\"bits\":8,\"length\":10," +
          "\"data\":[0,0,0,0,-10,10,-8,8,0,0,-2,2,-5,7,-6,3," +
          "-5,7,-6,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-2,2,-3,3]}"
        );
      });
    });

    describe(".toArrayBuffer()", function() {
      context("given JSON data with 2 channels", function() {
        it("should return an arraybuffer of the right length", function() {
          var data = getJSONData({ channels: 2 });
          var instance = WaveformData.create(data);
          var buffer = instance.toArrayBuffer();

          expect(buffer).to.be.an.instanceOf(ArrayBuffer);
          expect(buffer.byteLength).to.equal(64); // 24 bytes header + 40 bytes data
        });

        it("should construct WaveformData from arraybuffer", function() {
          var data = getJSONData({ channels: 2 });
          var instance = WaveformData.create(data);
          var buffer = instance.toArrayBuffer();
          var waveform = WaveformData.create(buffer);

          expect(waveform.length).to.equal(10);
          expect(waveform.bits).to.equal(8);
          expect(waveform.sample_rate).to.equal(48000);
          expect(waveform.scale).to.equal(512);
          expect(waveform.channels).to.equal(2);
          expect(waveform.channel(0).min_array()).to.deep.equal([0, -10, 0, -5, -5, 0, 0, 0, 0, -2]);
          expect(waveform.channel(0).max_array()).to.deep.equal([0, 10, 0, 7, 7, 0, 0, 0, 0, 2]);
          expect(waveform.channel(1).min_array()).to.deep.equal([0, -8, -2, -6, -6, 0, 0, 0, 0, -3]);
          expect(waveform.channel(1).max_array()).to.deep.equal([0, 8, 2, 3, 3, 0, 0, 0, 0, 3]);
        });
      });

      context("given JSON data with 16-bit values", function() {
        it("should return an arraybuffer of the right length", function() {
          var data = getJSONData({ channels: 2, bits: 16 });
          var instance = WaveformData.create(data);
          var buffer = instance.toArrayBuffer();

          expect(buffer).to.be.an.instanceOf(ArrayBuffer);
          expect(buffer.byteLength).to.equal(104); // 24 bytes header + 80 bytes data
        });
      });

      context("given binary data with 1 channel", function() {
        it("should return an arraybuffer of the right length", function() {
          var data = getBinaryData({ channels: 1 });
          var instance = WaveformData.create(data);
          var buffer = instance.toArrayBuffer();

          expect(buffer).to.be.an.instanceOf(ArrayBuffer);
          expect(buffer.byteLength).to.equal(40); // 20 bytes header + 20 bytes data
        });

        it("should construct WaveformData from arraybuffer", function() {
          var data = getBinaryData({ channels: 1 });
          var instance = WaveformData.create(data);
          var buffer = instance.toArrayBuffer();
          var waveform = WaveformData.create(buffer);

          expect(waveform.length).to.equal(10);
          expect(waveform.bits).to.equal(8);
          expect(waveform.sample_rate).to.equal(48000);
          expect(waveform.scale).to.equal(512);
          expect(waveform.channels).to.equal(1);
          expect(waveform.channel(0).min_array()).to.deep.equal([0, -10, 0, -5, -5, 0, 0, 0, 0, -2]);
          expect(waveform.channel(0).max_array()).to.deep.equal([0, 10, 0, 7, 7, 0, 0, 0, 0, 2]);
        });
      });
    });
  });
}
