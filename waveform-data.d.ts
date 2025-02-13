declare module 'waveform-data' {

  interface Options {

    /**
     * Number of audio samples per pixel. Default: 512
     */

    scale?: number;

    /**
     * Number of bits per sample (8 or 16). Default: 8
     */

    bits?: number;

    /**
     * Amplitude scale. Default: 1.0
     */

    amplitude_scale?: number;

    /**
     * Create a single or multi-channel waveform. Default: false
     */

    split_channels?: boolean;

    /**
     * Set to `true` to disable use of a Web Worker. Default: false
     */

    disable_worker?: boolean;
  }

  export interface WaveformDataAudioContextOptions extends Options {

    /**
     * The Web Audio AudioContext to use
     */

    audio_context: AudioContext;

    /**
     * An ArrayBuffer containing raw audio data (e.g., in WAV or MP3 format)
     */

    array_buffer: ArrayBuffer;
  }

  export interface WaveformDataAudioBufferOptions extends Options {

    /**
     * A Web Audio AudioBuffer containing decoded audio data
     */

    audio_buffer: AudioBuffer
  }

  export type WaveformDataFromAudioCallback = (
    error: DOMException,
    waveformData: WaveformData,
    audioBuffer: AudioBuffer
  ) => void;

  export interface JsonWaveformData {
    version: number;
    channels: number;
    sample_rate: number;
    samples_per_pixel: number;
    bits: number;
    length: number;
    data: Array<number>;
  }

  export interface WaveformDataChannel {

    /**
     * Returns the waveform minimum at the given index position
     */

    min_sample: (index: number) => number;

    /**
     * Returns the waveform minimum at the given index position
     */

    max_sample: (index: number) => number;

    /**
     * Returns all the waveform minimum values as an array
     */

    min_array: () => Array<number>;

    /**
     * Returns all the waveform maximum values as an array
     */

    max_array: () => Array<number>;
  }

  export class WaveformData {

    /**
     * Creates and returns a WaveformData instance from the given data,
     * which may be in binary (.dat) format in an ArrayBuffer, or a
     * JavaScript object
     */

    static create: (data: ArrayBuffer | JsonWaveformData) => WaveformData;

    /**
     * Creates a WaveformData object from audio using the Web Audio API
     */

    static createFromAudio: (
      options: WaveformDataAudioContextOptions | WaveformDataAudioBufferOptions,
      callback: WaveformDataFromAudioCallback
    ) => void;

    /**
     * Returns the sample rate of the original audio, in Hz
     */

    readonly sample_rate: number;

    /**
     * Returns the number of audio samples per pixel of the waveform data
     */

    readonly scale: number;

    /**
     * Returns the amount of time (in seconds) represented by a single pixel
     */

    readonly seconds_per_pixel: number;

    /**
     * Returns the number of pixels per second
     */

    readonly pixels_per_second: number;

    /**
     * Returns the length of the waveform data, in pixels
     */

    readonly length: number;

    /**
     * Returns the number of bits per sample, either 8 or 16
     */

    readonly bits: number;

    /**
     * Returns the approximate duration of the audio file, in seconds.
     *
     * The duration is approximate because it is calculated based on the
     * waveform length, number of samples per pixel, and audio sample rate
     */

    readonly duration: number;

    /**
     * Returns the pixel index for a given time
     */

    at_time: (time: number) => number;

    /**
     * Returns the time in seconds for a given pixel index
     */

    time: (time: number) => number;

    /**
     * Returns the number of waveform channels
     */

    readonly channels: number;

    /**
     * Returns a WaveformDataChannel object that provides access to the
     * waveform data for the given channel index
     */

    channel: (index: number) => WaveformDataChannel;

    /**
     * Creates and returns a new WaveformData object with resampled data.
     * Use this method to create waveform data at different zoom levels
     */

    resample: (
      options: { width: number } | { scale: number }
    ) => WaveformData;

    /**
     * Concatenates the receiver with one or more other waveforms, returning
     * a new WaveformData object. The waveforms must be compatible, i.e.,
     * have the same sample rate, scale, and number of channels
     */

    concat: (...args: Array<WaveformData>) => WaveformData;

    /**
     * Returns the waveform data as an object
     */

    toJSON: () => JsonWaveformData;

    /**
     * Returns the waveform data in binary format as an ArrayBuffer
     */

    toArrayBuffer: () => ArrayBuffer;
  }

  export default WaveformData;
}
