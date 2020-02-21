declare module 'waveform-data' {

    type Options = {
        /* optional props to override defaults */
        scale?: number,
        amplitude_scale?: number,
        split_channels?: boolean
    }

    export type WaveformAudioContextOptions = {
        audio_context: AudioContext
        array_buffer: ArrayBuffer
    } & Options;

    export type WaveformAudioBufferOptions = {
        audio_buffer: AudioBuffer
    } & Options

    export type WaveformFromAudioCallback = (error: null | DOMException, instance?: WaveformData, audioBuffer?: AudioBuffer) => void

    export type JsonWaveformData = {
        version: number
        channels: number
        sample_rate: number
        samples_per_pixel: number
        bits: number
        length: number
        data: Array<number>
    }

    export type WaveformDataChannel = {
        min_sample: (index: number) => number
        max_sample: (index: number) => number
        min_array: () => Array<number>
        max_array: () => Array<number>
    }

    declare class WaveformData {
        resample: (options: number | { width: number, scale: number }) => WaveformData;
        concat: (...args: Array<WaveformData>) => WaveformData;
        readonly length: number;
        readonly bits: number;
        readonly duration: number;
        readonly pixels_per_second: number;
        readonly seconds_per_pixel: number;
        readonly channels: number;
        channel: (index: number) => WaveformDataChannel;
        readonly sample_rate: number;
        readonly scale: number;
        at_time: (time: number) => number;
        time: (time: number) => number;

        static create: (data: ArrayBuffer | JsonWaveformData) => WaveformData;
        static createFromAudio: (options: WaveformAudioContextOptions | WaveformAudioBufferOptions, callback: WaveformFromAudioCallback) => void;
    }

    export = WaveformData;
}
