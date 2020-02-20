declare module 'waveform-data' {

    type WaveformDataChannelType = {
        min_sample: (index: number) => number
        max_sample: (index: number) => number
        min_array: (index: number) => Array<number>
        max_array: (index: number) => Array<number>
    }

    type WaveformDataType = {
        resample: (options: number | {width: number, scale: number}) => WaveformData
        concat: (args?: Array<WaveformDataType>) => WaveformDataType
        length: number
        bits: number
        duration: number
        pixels_per_second: number
        seconds_per_pixel: number
        channels: number
        channel: (index: number) => WaveformDataChannelType
        sample_rate: number
        scale: number
        at_time: (time: number) => number
        time: (time: number) => number
    }
    static const create: (data: any) => WaveformDataType
}
