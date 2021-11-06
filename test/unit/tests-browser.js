import { WaveformData, resampleWaveformData, concatWaveformData } from "../../src/waveform-data";

import waveformDataTests from "./waveform-data";
import waveformDataAudioBufferTests from "./builders/audiobuffer";
import waveformDataAudioContextTests from "./builders/webaudio";

waveformDataTests(WaveformData, resampleWaveformData, concatWaveformData);
waveformDataAudioBufferTests(WaveformData);
waveformDataAudioContextTests(WaveformData);
