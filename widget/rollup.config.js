import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/widget.js',
  output: {
    file: 'dist/widget.min.js',
    format: 'iife',
    name: 'TinyFeedback',
    banner: '/*! TinyFeedback Widget v1.0.0 | MIT */'
  },
  plugins: [
    nodeResolve(),
    terser({
      compress: {
        drop_console: false,
        drop_debugger: true,
        passes: 3,
        pure_funcs: ['console.log'],
        unsafe: true,
        unsafe_arrows: false,
        unsafe_methods: false
      },
      mangle: {
        properties: {
          regex: /^_/
        }
      },
      format: {
        comments: /^!/
      }
    })
  ]
};
