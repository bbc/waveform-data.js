var WaveformData = require("../../dist/waveform-data.cjs").WaveformData;
var resampleWaveformData = require("../../dist/waveform-data.cjs").resampleWaveformData;
var concatWaveformData = require("../../dist/waveform-data.cjs").concatWaveformData;

import waveformDataTests from "./waveform-data";
import resampleWaveformDataTests from "./resample-test";
import concatWaveformDataTests from "./concat-test";

waveformDataTests(WaveformData, concatWaveformData);
resampleWaveformDataTests(WaveformData, resampleWaveformData);
concatWaveformDataTests(WaveformData, concatWaveformData);
