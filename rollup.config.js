import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';

export default [
  // Main application bundle
  {
    input: '_javascript/commons.js',
    output: {
      file: 'assets/js/app.min.js',
      format: 'iife',
      sourcemap: !isProduction,
      globals: {
        'bootstrap/js/src/tooltip': 'bootstrap.Tooltip',
        'bootstrap/js/src/collapse': 'bootstrap.Collapse'
      }
    },
    external: [
      'bootstrap/js/src/tooltip',
      'bootstrap/js/src/collapse'
    ],
    plugins: [
      nodeResolve(),
      isProduction && terser()
    ].filter(Boolean)
  },
  // PWA Service Worker
  {
    input: '_javascript/pwa/sw.js',
    output: {
      file: 'assets/js/sw.min.js',
      format: 'iife',
      sourcemap: !isProduction
    },
    plugins: [
      nodeResolve(),
      isProduction && terser()
    ].filter(Boolean)
  },
  // Mermaid popup functionality
  {
    input: 'assets/js/mermaid-popup.js',
    output: {
      file: 'assets/js/mermaid-popup.min.js',
      format: 'iife',
      sourcemap: !isProduction
    },
    plugins: [
      nodeResolve(),
      isProduction && terser()
    ].filter(Boolean)
  },
  // Footnote tooltip functionality
  {
    input: 'assets/js/footnote-tooltip.js',
    output: {
      file: 'assets/js/footnote-tooltip.min.js',
      format: 'iife',
      sourcemap: !isProduction
    },
    plugins: [
      nodeResolve(),
      isProduction && terser()
    ].filter(Boolean)
  }
];
