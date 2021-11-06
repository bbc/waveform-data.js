import { WaveformData, resampleWaveformData, concatWaveformData,
  createWaveformDataFromAudioBuffer, createWaveformDataFromEncodedAudio } from "../../src/index";

import waveformDataTests from "./waveform-data";
import waveformDataAudioBufferTests from "./create-from-audio-buffer-test";
import waveformDataAudioContextTests from "./create-from-encoded-audio-test";
import resampleWaveformDataTests from "./resample-test";
import concatWaveformDataTests from "./concat-test";

waveformDataTests(WaveformData);
waveformDataAudioBufferTests(WaveformData, createWaveformDataFromAudioBuffer);
waveformDataAudioContextTests(WaveformData, createWaveformDataFromEncodedAudio);
resampleWaveformDataTests(WaveformData, resampleWaveformData);
concatWaveformDataTests(WaveformData, concatWaveformData);
