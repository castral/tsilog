/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [

  ],
  build: {
    outDir: 'dist',
    target: 'es2022',
    sourcemap: true,
    lib: {
      entry: 'lib/index.ts',
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    rollupOptions: {
      output: {
        esModule: true,
        format: 'esm',
        sourcemap: 'inline',
        strict: true,
      }
    }
  },
  test: {
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.spec.json',
    },
  }
});
