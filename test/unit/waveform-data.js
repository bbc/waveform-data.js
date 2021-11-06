import { getExpectedData, getJSONData, getBinaryData } from "../fixtures";

import { expect } from "chai";

export default function waveformDataTests(WaveformData, resampleWaveformData, concatWaveformData) {
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
        const data = getBinaryData({ version: 3 });

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
