import { babel } from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';

export default [
  {
    input: 'src/waveform-data.js',
    output: [
      {
        file: 'dist/waveform-data.js',
        format: 'umd',
        name: 'WaveformData',
        sourcemap: true
      },
      {
        file: 'dist/waveform-data.min.js',
        format: 'umd',
        name: 'WaveformData',
        sourcemap: true,
        plugins: [
          terser()
        ]
      }
    ],
    plugins: [
      resolve({ browser: true }),
      webWorkerLoader(),
      babel({ babelHelpers: 'bundled' })
    ]
  },
  {
    input: 'src/waveform-data.js',
    output: [
      {
        file: 'dist/waveform-data.esm.js',
        name: 'waveform-data',
        format: 'es'
      }
    ],
    plugins: [
      resolve({ browser: true }),
      webWorkerLoader({
        targetPlatform: 'browser'
      }),
      babel({ babelHelpers: 'bundled' })
    ]
  },
  {
    input: 'src/waveform-data.js',
    output: [
      {
        file: 'dist/waveform-data.cjs.js',
        name: 'waveform-data',
        format: 'cjs',
        // Corresonds to 'module.exports = WaveformData'
        exports: 'default'
      }
    ],
    plugins: [
      resolve({ browser: true }),
      webWorkerLoader(),
      babel({ babelHelpers: 'bundled' })
    ]
  }

];
