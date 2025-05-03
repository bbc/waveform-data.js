import WaveformData from '../../src/waveform-data';

import waveformDataTests from './waveform-data';
import waveformDataAudioBufferTests from './builders/audiobuffer';
import waveformDataAudioContextTests from './builders/webaudio';

waveformDataTests(WaveformData);
waveformDataAudioBufferTests(WaveformData);
waveformDataAudioContextTests(WaveformData);
