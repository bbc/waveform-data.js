import { WaveformData, resampleWaveformData, concatWaveformData } from "../../dist/waveform-data.esm";

import waveformDataTests from "./waveform-data";

waveformDataTests(WaveformData, resampleWaveformData, concatWaveformData);
