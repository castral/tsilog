/// <reference types="vitest/config" />
import { defineConfig, type UserConfig } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: [
        './tsconfig.json',
        './tsconfig.spec.json',
      ],
    }),
  ],

  build: {
    outDir: 'dist',
    target: 'es2022',
    sourcemap: true,
    lib: {
      entry: './lib/index.ts',
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    rollupOptions: {
      output: {
        esModule: true,
        format: 'esm',
        sourcemap: 'inline',
        strict: true,
      },
    },
  },

  test: {
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.spec.json',
    },

    coverage: {
      include: [
        './lib/**/*.ts',
      ],
      enabled: true,
      provider: 'v8',
      reporter: ['html', 'json', 'text'],
      reportsDirectory: 'coverage',
      thresholds: {
        [100]: true,
      },
    },

    include: [
      './spec/**/*.spec.ts',
    ],
    setupFiles: ['./spec/spec-setup.ts'],
    environment: 'node',
    globals: true,
    passWithNoTests: false,
    disableConsoleIntercept: true,
    printConsoleTrace: true,
    reporters: ['verbose'],
    sequence: {
      concurrent: true,
    },
    slowTestThreshold: 1000,
    watch: false,
  },
}) satisfies UserConfig as UserConfig;
