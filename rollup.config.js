import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import path from 'path';

import pkg from './package.json';

function sourcemapPathTransform(sourcePath) {
  return path.join('node_modules', pkg.name, './src', sourcePath);
}

export default [
  {
    input: 'src/waveform-data.js',
    output: [
      {
        file: 'dist/waveform-data.js',
        format: 'umd',
        name: 'WaveformData',
        sourcemap: true,
        freeze: false
      },
      {
        file: 'dist/waveform-data.min.js',
        format: 'umd',
        name: 'WaveformData',
        sourcemap: true,
        freeze: false,
        plugins: [
          terser()
        ]
      }
    ],
    external: [],
    watch: {
      include: 'src/**',
    },
    plugins: [
      commonjs(),
      resolve({ browser: true }),
      babel({ babelHelpers: 'bundled' })
    ]
  },
  // dist/waveform-data.esm.js is an ES module bundle
  {
    input: 'src/waveform-data.js',
    output: [
      {
        file: 'dist/waveform-data.esm.js',
        name: 'waveform-data',
        format: 'es',
        sourcemap: true,
        sourcemapPathTransform,
        freeze: false
      }
    ],
    plugins: [
      commonjs(),
      resolve({ browser: true }),
      babel({ babelHelpers: 'bundled' })
    ]
  }
];
