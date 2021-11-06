import { WaveformData, resampleWaveformData, concatWaveformData } from "../../dist/waveform-data.esm";

import waveformDataTests from "./waveform-data";
import resampleWaveformDataTests from "./resample-test";
import concatWaveformDataTests from "./concat-test";

waveformDataTests(WaveformData, resampleWaveformData, concatWaveformData);
resampleWaveformDataTests(WaveformData, resampleWaveformData);
concatWaveformDataTests(WaveformData, concatWaveformData);
