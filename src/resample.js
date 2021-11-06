import WaveformData from "./waveform-data";
import WaveformResampler from "./waveform-resampler";

function getResampleOptions(waveformData, options) {
  var opts = {};

  if (!options) {
    throw new Error("WaveformData.resample(): Missing options");
  }

  opts.scale = options.scale;
  opts.width = options.width;

  if (opts.width != null && (typeof opts.width !== "number" || opts.width <= 0)) {
    throw new RangeError("WaveformData.resample(): width should be a positive integer value");
  }

  if (opts.scale != null && (typeof opts.scale !== "number" || opts.scale <= 0)) {
    throw new RangeError("WaveformData.resample(): scale should be a positive integer value");
  }

  if (!opts.scale && !opts.width) {
    throw new Error("WaveformData.resample(): Missing scale or width option");
  }

  if (opts.width) {
    // Calculate the target scale for the resampled waveform
    opts.scale = Math.floor(waveformData.duration * waveformData.sample_rate / opts.width);
  }

  if (opts.scale < waveformData.scale) {
    throw new Error(
      "WaveformData.resample(): Zoom level " + opts.scale +
      " too low, minimum: " + waveformData.scale
    );
  }

  opts.abortSignal = options.abortSignal;

  return opts;
}

function resampleWaveformData(waveformData, options) {
  options = getResampleOptions(waveformData, options);

  var resampler = new WaveformResampler(waveformData, options);

  while (!resampler.next()) {
    // nothing
  }

  return new WaveformData(resampler.getOutputData());
}

export default resampleWaveformData;
