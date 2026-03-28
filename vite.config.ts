/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type PluginOption, type UserConfig } from 'vite';

export default defineConfig(async ({ mode }) => {
  // const env = loadEnv(mode, process.cwd(), '');

  const devPlugins: PluginOption[] = [];

  if (mode === 'development') {
    try {
      const module = await import('unplugin-dts/vite');
      const plugin = module.default({ tsconfigPath: './tsconfig.dev.json' });
      devPlugins.push(...(Array.isArray(plugin) ? plugin : [plugin]));
    } catch (e) {
      console.error('Failed to load unplugin-dts/vite', e);
    }
  }

  return {
    plugins: [
      ...devPlugins,
    ],

    build: {
      outDir: 'dist',
      target: 'es2022',
      sourcemap: mode === 'development',
      emptyOutDir: mode === 'production',
      minify: mode === 'production' ? 'oxc' : false,
      lib: {
        entry: './lib/tsilog.ts',
        formats: ['es'],
        fileName: 'tsilog',
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
          './lib/spec-setup.ts',
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
  } satisfies UserConfig;
});
