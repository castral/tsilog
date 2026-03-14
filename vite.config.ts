/// <reference types="vitest/config" />
import { defineConfig, type Plugin as VitePlugin, type UserConfig } from 'vite';

const viteDts: VitePlugin[] = [];
try {
  // @ts-ignore
  const module = await import('unplugin-dts/vite');
  const plugin = module.default({tsconfigPath: './tsconfig.json'});
  viteDts.push(...(Array.isArray(plugin) ? plugin : [plugin]));
} catch (e) {
  console.error('Failed to load unplugin-dts/vite', e);
}

const config: UserConfig = defineConfig({
  plugins: [
    ...viteDts,
  ],

  build: {
    emptyOutDir: false,
    outDir: 'dist',
    target: 'es2022',
    sourcemap: true,
    lib: {
      entry: './lib/index.ts',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rolldownOptions: {
      output: {
        esModule: true,
        format: 'esm',
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
      exclude: [
        './lib/**/*.spec.ts',
        './lib/spec-setup.ts'
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
      './lib/**/*.spec.ts',
    ],
    setupFiles: ['./lib/spec-setup.ts'],
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
});

export default config;
