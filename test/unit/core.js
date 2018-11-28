"use strict";

/* globals beforeEach, context, describe, it */

var WaveformData = require("../../waveform-data");
var fixtures = require("../fixtures");
var expect = require("chai").expect;

if (global.XMLHttpRequest === undefined) {
  global.XMLHttpRequest = function() {
    return null;
  };
}

describe("WaveformData", function() {
  var instance;
  var expectations = fixtures.getExpectedData();

  it("should provide an `adapter` static properties and an `adapters` storage", function() {
    expect(WaveformData.adapters).to.be.an("object");
    expect(WaveformData.adapter).to.be.a("function");
  });

  describe(".create", function() {
    it("should not build an instance for an unknown data type", function() {
      expect(function() {
        WaveformData.create(0);
      }).to.throw("Could not detect a WaveformData adapter from the input.");

      expect(function() {
        WaveformData.create(null);
      }).to.throw("Could not detect a WaveformData adapter from the input.");
    });

    it("should select the correct adapter based on the given data", function() {
      const data = fixtures.getJSONData({ channels: 1 });

      expect(WaveformData.create(data).adapter)
        .to.be.an.instanceOf(WaveformData.adapters.object);

      expect(WaveformData.create(JSON.stringify(data)).adapter)
        .to.be.an.instanceOf(WaveformData.adapters.object);

      const binaryData = fixtures.getBinaryData({ channels: 2 });

      expect(WaveformData.create(binaryData).adapter)
        .to.be.an.instanceOf(WaveformData.adapters.arraybuffer);
    });

    it("should select the correct adapter based on a given HTTP response", function() {
      expect(function() {
        WaveformData.create(new XMLHttpRequest());
      }).to.throw("Could not detect a WaveformData adapter from the input.");

      const data = fixtures.getJSONData({ channels: 1 });

      var jsonAsTextResponse = {
        response: JSON.stringify(data),
        responseText: JSON.stringify(data)
      };

      var jsonAsObjectResponse = {
        response: data,
        responseType: "json",
        responseText: new Error("Accessing this property throws an exception in the browser.")
      };

      expect(WaveformData.create(jsonAsTextResponse).adapter)
        .to.be.an.instanceOf(WaveformData.adapters.object);

      expect(WaveformData.create(jsonAsObjectResponse).adapter)
        .to.be.an.instanceOf(WaveformData.adapters.object);

      const binaryData = fixtures.getBinaryData({ channels: 2 });

      var arrayBufferResponse = {
        response: binaryData,
        responseType: "arraybuffer",
        responseText: new Error("Accessing this property throws an exception in the browser.")
      };

      expect(WaveformData.create(arrayBufferResponse).adapter)
        .to.be.an.instanceOf(WaveformData.adapters.arraybuffer);
    });

    it("should not build an instance for an unknown version", function() {
      const data = fixtures.getBinaryData({ version: 3 });

      expect(function() {
        WaveformData.create(data);
      }).to.throw(Error);
    });
  });

  context("given a single channel waveform data file", function() {
    beforeEach(function() {
      const data = fixtures.getBinaryData({ channels: 1 });

      instance = new WaveformData(data, WaveformData.adapters.arraybuffer);
    });

    it("should enable us to create a valid offset of data", function() {
      expect(instance.offset_length).to.equal(expectations.length);
      expect(instance.offset_end).to.equal(expectations.length);

      // remember, if data length = 10, we have 20 items in the array
      // but it's internal and no one cares about it
      // so we always think in terms of pixel display

      // regular usage
      instance.offset(2, 5); // last offset is 2 + 5 = 7
      expect(instance.offset_length).to.equal(3);
      expect(instance.offset_end).to.equal(5);

      // ending after the length
      instance.offset(5, 15);
      expect(instance.offset_length).to.equal(5);  // because index 5 to 9 [total is 0 -> 9]
      expect(instance.offset_end).to.equal(10);

      // negative start and ends
      expect(function() {
        instance.offset(0, -5);
      }).to.throw(Error);

      expect(function() {
        instance.offset(-5, 25);
      }).to.throw(Error);

      // starting after the length
      expect(function() {
        instance.offset(15, 25);
      }).to.throw(Error);

      // ending before the beginning (if you think the second argument is length)
      expect(function() {
        instance.offset(15, 5);
      }).to.throw(Error);
    });

    describe(".channels", function() {
      it("should return the correct number of channels", function() {
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

    describe(".min", function() {
      beforeEach(function() {
        instance.offset(2, 5);
      });

      it("should return the 3 minimum values, at index 5, 7 and 9", function() {
        expect(instance.channel(0).min).to.deep.equal([0, -5, -5]);
      });
    });

    describe(".max", function() {
      beforeEach(function() {
        instance.offset(2, 5);
      });

      it("should return the 3 minimum values, at index 6, 8 and 10", function() {
        expect(instance.channel(0).max).to.deep.equal([0, 7, 7]);
      });
    });

    describe(".length", function() {
      it("should return the length of the waveform", function() {
        expect(instance.length).to.equal(expectations.length);
      });

      it("should return the length of the waveform when an offset is set", function() {
        instance.offset(2, 5);
        expect(instance.length).to.equal(expectations.length);
      });
    });

    describe(".duration", function() {
      it("should return the duration of the media when no offset is set", function() {
        expect(instance.duration).to.equal(expectations.duration);
      });

      it("should return the duration of the media even when an offset is set", function() {
        instance.offset(2, 5);
        expect(instance.duration).to.equal(expectations.duration);
      });
    });

    describe(".offset_duration", function() {
      it("should return the duration of the media when no offset is set", function() {
        expect(instance.offset_duration).to.equal(expectations.duration);
      });

      it("should return the duration of the offset even when an offset is set", function() {
        instance.offset(2, 5);
        expect(instance.offset_duration).to.equal(0.032);   // 3 * 512 / 48000
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

    describe(".in_offset()", function() {
      it("should consider a pixel index of 0 to be in the offset, when not set", function() {
        expect(instance.in_offset(0)).to.be.true;
      });

      it("should consider a pixel index of 9 to be in the offset, when not set", function() {
        expect(instance.in_offset(9)).to.be.true;
      });

      it("should consider a pixel index of 10 not to be in the offset", function() {
        expect(instance.in_offset(10)).to.be.false;
      });

      it("should consider a pixel index of 4 to be in an offset of 4 to 6", function() {
        instance.offset(4, 6);
        expect(instance.in_offset(4)).to.be.true;
      });

      it("should consider a pixel index of 5 to be in an offset of 4 to 6", function() {
        instance.offset(4, 6);
        expect(instance.in_offset(5)).to.be.true;
      });

      it("should consider a pixel index of 6 not to be in an offset of 4 to 6", function() {
        instance.offset(4, 6);
        expect(instance.in_offset(6)).to.be.false;
      });
    });

    it("should return the correct minimum waveform value for a given index", function() {
      expect(instance.channel(0).min_sample(0)).to.equal(0);
      expect(instance.channel(0).min_sample(4)).to.equal(-5);
      expect(instance.channel(0).min_sample(9)).to.equal(-2);
    });

    it("should return the correct maximum waveform value for a given index", function() {
      expect(instance.channel(0).max_sample(0)).to.equal(0);
      expect(instance.channel(0).max_sample(4)).to.equal(7);
      expect(instance.channel(0).max_sample(9)).to.equal(2);
    });

    describe(".resample()", function() {
      it("should throw an error if attempting to resample to a width larger than the waveform length", function() {
        expect(function() {
          instance.resample(11);
        }).to.throw(Error);
      });

      it("should throw an error if the scale value is not a positive integer", function() {
        expect(function() {
          instance.resample({ scale: 0 });
        }).to.throw(RangeError);
      });

      it("should throw an error if the width value is not a positive integer", function() {
        expect(function() {
          instance.resample({ width: 0 });
        }).to.throw(RangeError);
      });

      it("should throw an error if both width and scale are missing", function() {
        expect(function() {
          instance.resample({});
        }).to.throw(Error);
      });

      describe("full resample by width", function() {
        it("should resample to 5 elements if a width of 5 is requested", function() {
          expect(instance.resample({ width: 5 }).adapter).to.have.a.lengthOf(5);
        });

        it("should resample to an expected duration if a width of 5 is requested", function() {
          expect(instance.resample({ width: 5 })).to.have.property("duration", expectations.duration);
        });
      });

      // if we double the scale, it should fit in half the previous size (which means 5px)
      describe("full resample by scale", function() {
        it("should downsize the number of data by 2 if we request a half-size scaled resampled waveform", function() {
          expect(instance.resample({ scale: 1024 }).adapter)
            .to.have.lengthOf(expectations.resampled_length);
        });

        it("should downsize the duration by 2 if we request a half-size scaled resampled waveform", function() {
          expect(instance.resample({ scale: 1024 }))
            .to.have.property("duration", expectations.duration);
        });

        it("should resample to a set of expected values", function() {
          var resampled = instance.resample({ scale: 1024 });

          expect(resampled.channel(0).min).to.deep.equal(expectations.resampled_values.channels[0].min);
          expect(resampled.channel(0).max).to.deep.equal(expectations.resampled_values.channels[0].max);
        });
      });

      describe("partial resampling at a specific time", function() {
        it("should accept only a positive input_index value", function() {
          expect(function() {
            instance.resample({ scale: 1024, input_index: -1 });
          }).to.throw(RangeError);
        });

        it("should accept only a positive output_index value", function() {
          expect(function() {
            instance.resample({ scale: 1024, output_index: -1 });
          }).to.throw(RangeError);
        });

        it("should throw an exception if any of the 4 mandatories options are missing", function() {
          expect(function() {
            instance.resample({ scale: 1024, input_index: 1, output_index: 1 });
          }).to.throw(Error);
        });

        it("should crop the sample count to the defined length option value", function() {
          var data = instance.resample({ scale: 1024, input_index: 1, output_index: 1, width: 3 });

          expect(data.adapter).to.have.a.lengthOf(3);
        });
      });
    });

    describe(".offset()", function() {
      it("should throw an exception if start is negative", function() {
        expect(function() {
          instance.offset(-1, 10);
        }).to.throw(Error);
      });

      it("should throw an exception if end is negative", function() {
        expect(function() {
          instance.offset(1, -1);
        }).to.throw(Error);
      });

      it("should allow a zero offset length", function() {
        instance.offset(0, 0);
        expect(instance.offset_length).to.equal(0);
      });
    });

    describe(".adapter", function() {
      it("should assign the provided argument as this.data", function() {
        var data = { foo: "bar" };

        // eslint-disable-next-line new-cap
        expect(new WaveformData.adapter(data)).to.have.property("data", data);
      });
    });
  });

  context("given a two channel waveform data file", function() {
    beforeEach(function() {
      const data = fixtures.getBinaryData({ channels: 2 });

      instance = new WaveformData(data, WaveformData.adapters.arraybuffer);
    });

    it("the default offset should cover the entire waveform duration", function() {
      expect(instance.offset_start).to.equal(0);
      expect(instance.offset_end).to.equal(expectations.length);
      expect(instance.offset_length).to.equal(expectations.length);
    });

    describe(".offset()", function() {
      it("should enable us to create a valid offset of data", function() {
        // remember, if data length = 10, we have 20 items in the array
        // but it's internal and no one cares about it
        // so we always think in terms of pixel display

        // regular usage
        instance.offset(2, 5); // last offset is 2 + 5 = 7
        expect(instance.offset_length).to.equal(3);
        expect(instance.offset_end).to.equal(5);

        // ending after the length
        instance.offset(5, 15);
        expect(instance.offset_length).to.equal(5);  // because index 5 to 9 [total is 0 -> 9]
        expect(instance.offset_end).to.equal(10);

        // negative start and ends
        expect(function() {
          instance.offset(0, -5);
        }).to.throw(Error);

        expect(function() {
          instance.offset(-5, 25);
        }).to.throw(Error);

        // starting after the length
        expect(function() {
          instance.offset(15, 25);
        }).to.throw(Error);

        // ending before the beginning (if you think the second argument is length)
        expect(function() {
          instance.offset(15, 5);
        }).to.throw(Error);
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
    });

    describe(".min", function() {
      beforeEach(function() {
        instance.offset(2, 5);
      });

      it("should return the 3 minimum values within the offset range", function() {
        expect(instance.channel(0).min).to.deep.equal([0, -5, -5]);
        expect(instance.channel(1).min).to.deep.equal([-2, -6, -6]);
      });
    });

    describe(".max", function() {
      beforeEach(function() {
        instance.offset(2, 5);
      });

      it("should return the 3 minimum values within the offset range", function() {
        expect(instance.channel(0).max).to.deep.equal([0, 7, 7]);
        expect(instance.channel(1).max).to.deep.equal([2, 3, 3]);
      });
    });

    describe(".duration", function() {
      it("should return the duration of the media when no offset is set", function() {
        expect(instance.duration).to.equal(expectations.duration);
      });

      it("should return the duration of the media even when an offset is set", function() {
        instance.offset(2, 5);
        expect(instance.duration).to.equal(expectations.duration);
      });
    });

    describe(".offset_duration", function() {
      it("should return the duration of the media when no offset is set", function() {
        expect(instance.offset_duration).to.equal(expectations.duration);
      });

      it("should return the duration of the offset even when an offset is set", function() {
        instance.offset(2, 5);
        expect(instance.offset_duration).to.equal(0.032);   // 3 * 512 / 48000
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

    describe(".in_offset()", function() {
      it("should consider a pixel index of 0 to be in the offset, when not set", function() {
        expect(instance.in_offset(0)).to.be.true;
      });

      it("should consider a pixel index of 9 to be in the offset, when not set", function() {
        expect(instance.in_offset(9)).to.be.true;
      });

      it("should consider a pixel index of 10 not to be in the offset", function() {
        expect(instance.in_offset(10)).to.be.false;
      });

      it("should consider a pixel index of 4 to be in an offset of 4 to 6", function() {
        instance.offset(4, 6);
        expect(instance.in_offset(4)).to.be.true;
      });

      it("should consider a pixel index of 5 to be in an offset of 4 to 6", function() {
        instance.offset(4, 6);
        expect(instance.in_offset(5)).to.be.true;
      });

      it("should consider a pixel index of 6 not to be in an offset of 4 to 6", function() {
        instance.offset(4, 6);
        expect(instance.in_offset(6)).to.be.false;
      });
    });

    it("should return the proper minimum value for a given pixel index", function() {
      expect(instance.channel(0).min_sample(0)).to.equal(0);
      expect(instance.channel(0).min_sample(4)).to.equal(-5);
      expect(instance.channel(0).min_sample(9)).to.equal(-2);

      expect(instance.channel(1).min_sample(0)).to.equal(0);
      expect(instance.channel(1).min_sample(4)).to.equal(-6);
      expect(instance.channel(1).min_sample(9)).to.equal(-3);
    });

    it("should return the proper maximum value for a given pixel index", function() {
      expect(instance.channel(0).max_sample(0)).to.equal(0);
      expect(instance.channel(0).max_sample(4)).to.equal(7);
      expect(instance.channel(0).max_sample(9)).to.equal(2);

      expect(instance.channel(1).max_sample(0)).to.equal(0);
      expect(instance.channel(1).max_sample(4)).to.equal(3);
      expect(instance.channel(1).max_sample(9)).to.equal(3);
    });

    describe(".resample()", function() {
      it("should throw an error if attempting to resample to a width larger than the waveform length", function() {
        expect(function() {
          instance.resample(11);
        }).to.throw(Error);
      });

      it("should throw an error if the scale value is not a positive integer", function() {
        expect(function() {
          instance.resample({ scale: 0 });
        }).to.throw(RangeError);
      });

      it("should throw an error if the width value is not a positive integer", function() {
        expect(function() {
          instance.resample({ width: 0 });
        }).to.throw(RangeError);
      });

      it("should throw an error if both width and scale are missing", function() {
        expect(function() {
          instance.resample({});
        }).to.throw(Error);
      });

      describe("full resample by width", function() {
        it("should resample to 5 elements if a width of 5 is requested", function() {
          expect(instance.resample({ width: 5 }).adapter).to.have.a.lengthOf(5);
        });

        it("should resample to an expected duration if a width of 5 is requested", function() {
          expect(instance.resample({ width: 5 })).to.have.property("duration", expectations.duration);
        });

        it("should contain the same number of channels", function() {
          expect(instance.resample({ width: 5 }).channels).to.equal(2);
        });
      });

      // if we double the scale, it should fit in half the previous size (which means 5px)
      describe("full resample by scale", function() {
        it("should downsize the number of data by 2 if we request a half-size scaled resampled waveform", function() {
          expect(instance.resample({ scale: 1024 }).adapter)
            .to.have.lengthOf(expectations.resampled_length);
        });

        it("should downsize the duration by 2 if we request a half-size scaled resampled waveform", function() {
          expect(instance.resample({ scale: 1024 }))
            .to.have.property("duration", expectations.duration);
        });

        it("should resample to a set of expected values", function() {
          var resampled = instance.resample({ scale: 1024 });

          expect(resampled.channel(0).min).to.deep.equal(expectations.resampled_values.channels[0].min);
          expect(resampled.channel(0).max).to.deep.equal(expectations.resampled_values.channels[0].max);

          expect(resampled.channel(1).min).to.deep.equal(expectations.resampled_values.channels[1].min);
          expect(resampled.channel(1).max).to.deep.equal(expectations.resampled_values.channels[1].max);
        });
      });

      describe("partial resampling at a specific time", function() {
        it("should accept only a positive input_index value", function() {
          expect(function() {
            instance.resample({ scale: 1024, input_index: -1 });
          }).to.throw(RangeError);
        });

        it("should accept only a positive output_index value", function() {
          expect(function() {
            instance.resample({ scale: 1024, output_index: -1 });
          }).to.throw(RangeError);
        });

        it("should throw an exception if any of the 4 mandatories options are missing", function() {
          expect(function() {
            instance.resample({ scale: 1024, input_index: 1, output_index: 1 });
          }).to.throw(Error);
        });

        it("should crop the sample count to the defined length option value", function() {
          var data = instance.resample({ scale: 1024, input_index: 1, output_index: 1, width: 3 });

          expect(data.adapter).to.have.a.lengthOf(3);
        });
      });
    });

    describe(".offset()", function() {
      it("should throw an exception if start is negative", function() {
        expect(function() {
          instance.offset(-1, 10);
        }).to.throw(Error);
      });

      it("should throw an exception if end is negative", function() {
        expect(function() {
          instance.offset(1, -1);
        }).to.throw(Error);
      });

      it("should allow a zero offset length", function() {
        instance.offset(0, 0);
        expect(instance.offset_length).to.equal(0);
      });
    });

    describe(".adapter", function() {
      it("should assign the provided argument as this.data", function() {
        var data = { foo: "bar" };

        // eslint-disable-next-line new-cap
        expect(new WaveformData.adapter(data)).to.have.property("data", data);
      });
    });
  });

  describe(".at_time", function() {
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

    it("should be able to convert between pixel indexes and times without losing precision", function() {
      expect(instance.at_time(instance.time(0))).to.equal(0);
      expect(instance.at_time(instance.time(14))).to.equal(14);
      expect(instance.at_time(instance.time(93))).to.equal(93);
    });
  });

  describe(".time", function() {
    it("should return a time of 0 seconds for a given pixel index of 0", function() {
      expect(instance.time(0)).to.equal(0);
    });

    it("should return a time of 0.0015999999999999999 seconds for a given pixel index of 0.15", function() {
      expect(instance.time(0.15)).to.equal(0.0015999999999999999); // 0.15 * 512 / 48000
    });

    it("should return a time of 0.010666666666666666 seconds for a given pixel index of 1", function() {
      expect(instance.time(1)).to.equal(0.010666666666666666);     // 1 * 512 / 48000
    });
  });
});
