var WaveformData = require("../../dist/waveform-data.cjs").WaveformData;
var resampleWaveformData = require("../../dist/waveform-data.cjs").resampleWaveformData;
var concatWaveformData = require("../../dist/waveform-data.cjs").concatWaveformData;

import waveformDataTests from "./waveform-data";

waveformDataTests(WaveformData, resampleWaveformData, concatWaveformData);
