/**
 * Rollup configuration for @ldesign/grid
 */

import { defineConfig } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'

const external = ['gridstack', 'vue', 'react', 'react-dom', 'lit']

export default defineConfig([
  // ESM and CJS builds
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'es',
        sourcemap: true
      },
      {
        file: 'dist/index.cjs',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      }
    ],
    external,
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist',
        rootDir: 'src'
      })
    ]
  },

  // Vue adapter
  {
    input: 'src/adapters/vue/index.ts',
    output: [
      {
        file: 'dist/adapters/vue/index.js',
        format: 'es',
        sourcemap: true
      },
      {
        file: 'dist/adapters/vue/index.cjs',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      }
    ],
    external: [...external, /^@ldesign\/grid/],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist/adapters/vue',
        rootDir: 'src/adapters/vue'
      })
    ]
  },

  // React adapter
  {
    input: 'src/adapters/react/index.ts',
    output: [
      {
        file: 'dist/adapters/react/index.js',
        format: 'es',
        sourcemap: true
      },
      {
        file: 'dist/adapters/react/index.cjs',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      }
    ],
    external: [...external, /^@ldesign\/grid/],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist/adapters/react',
        rootDir: 'src/adapters/react'
      })
    ]
  },

  // Lit adapter
  {
    input: 'src/adapters/lit/index.ts',
    output: [
      {
        file: 'dist/adapters/lit/index.js',
        format: 'es',
        sourcemap: true
      },
      {
        file: 'dist/adapters/lit/index.cjs',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      }
    ],
    external: [...external, /^@ldesign\/grid/],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist/adapters/lit',
        rootDir: 'src/adapters/lit'
      })
    ]
  },

  // Presets
  {
    input: 'src/presets/index.ts',
    output: [
      {
        file: 'dist/presets/index.js',
        format: 'es',
        sourcemap: true
      },
      {
        file: 'dist/presets/index.cjs',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      }
    ],
    external: [...external, /^@ldesign\/grid/],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist/presets',
        rootDir: 'src/presets'
      })
    ]
  }
])

