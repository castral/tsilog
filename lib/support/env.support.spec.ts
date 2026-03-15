import { afterEach, describe, it, vi } from 'vitest';

import { EnvironmentMap, EnvironmentProperty, makeTsilogEnvKey } from './env.support.ts';

function stubNonDefaultValues(pairs: ([string, string])[]) {
  vi.spyOn(process, 'versions', 'get')
    .mockReturnValue({
      ...process.versions,
      bun: '1.0.0',
      deno: '1.0.0',
      node: '16.0.0',
    });

  vi.stubGlobal('window', {});
  vi.stubGlobal('document', {});

  for (const [key, value] of pairs) {
    vi.stubEnv(key, value);
  }
}

describe('EnvironmentMap', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('should make a TsilogEnvKey', ({ expect }) => {
    expect.assertions(2);

    const assertKey = makeTsilogEnvKey(EnvironmentProperty.Asserts);

    expect(assertKey).toBe('TSILOG_ASSERTS');

    const assertKeyRemake = makeTsilogEnvKey(assertKey);

    expect(assertKeyRemake).toBe('TSILOG_ASSERTS');
  });

  it('should return the correct overridden value', ({ expect }) => {
    expect.assertions(8);

    stubNonDefaultValues([
      [makeTsilogEnvKey(EnvironmentProperty.Asserts), 'false'],
      [makeTsilogEnvKey(EnvironmentProperty.Debug), 'true'],
      [makeTsilogEnvKey(EnvironmentProperty.Enabled), 'false'],
      [EnvironmentProperty.CI.toUpperCase(), 'true'],
    ]);

    const map = new EnvironmentMap();

    expect(map.asserts).toBe(false); // false
    expect(map.isDebug).toBe(true);
    expect(map.isEnabled).toBe(false); // false
    expect(map.isCI).toBe(true);
    expect(map.isBun).toBe(true);
    expect(map.isBrowser).toBe(true);
    expect(map.isDeno).toBe(true);
    expect(map.isNode).toBe(true);
  });

  it('should return default values by default', ({ expect }) => {
    expect.assertions(8);

    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    vi.stubGlobal('process', { env: {}});

    const map = new EnvironmentMap();

    expect(map.asserts).toBe(true); // true
    expect(map.isDebug).toBe(false);
    expect(map.isEnabled).toBe(true); // true
    expect(map.isCI).toBe(false);
    expect(map.isBun).toBe(false);
    expect(map.isBrowser).toBe(false);
    expect(map.isDeno).toBe(false);
    expect(map.isNode).toBe(false);
  });

  it('should return true only for specific node envs', ({ expect }) => {
    expect.assertions(6);

    vi.stubEnv('NODE_ENV', 'dev');

    expect(new EnvironmentMap().isProduction).toBe(false);
    expect(new EnvironmentMap().isTest).toBe(false);

    vi.stubEnv('NODE_ENV', 'production');

    expect(new EnvironmentMap().isProduction).toBe(true);
    expect(new EnvironmentMap().isTest).toBe(false);

    vi.stubEnv('NODE_ENV', 'test');

    expect(new EnvironmentMap().isProduction).toBe(false);
    expect(new EnvironmentMap().isTest).toBe(true);
  });

  it('should return true when inside workers', ({ expect }) => {
    expect.assertions(6);

    expect(new EnvironmentMap().isWorker).toBe(false);

    vi.stubGlobal('WorkerGlobalScope', {});

    expect(new EnvironmentMap().isWorker).toBe(true);

    vi.unstubAllGlobals();

    vi.stubGlobal('importScripts', vi.fn());

    expect(new EnvironmentMap().isWorker).toBe(true);

    vi.unstubAllGlobals();

    vi.stubGlobal('navigator', {
      userAgent: 'Cloudflare-Workers',
    });

    expect(new EnvironmentMap().isWorker).toBe(true);

    vi.stubGlobal('navigator', {
      userAgent: 'Cloudflare-ButNotAWorker',
    });

    expect(new EnvironmentMap().isWorker).toBe(false);

    vi.stubGlobal('navigator', undefined);

    expect(new EnvironmentMap().isWorker).toBe(false);
  });

  it('should get arbitrary env values from the environment', ({ expect }) => {
    expect.assertions(4);

    vi.stubGlobal('process', {
      env: {
        'SOME_KEY': 'some value',
      },
    });

    const env = new EnvironmentMap();

    expect(env.get('SOME_KEY')).toBe('some value');

    expect(env.get('UNDEFINED_KEY')).not.toBeDefined();

    vi.unstubAllGlobals();

    vi.stubEnv('DIFFERENT_KEY', 'new value');

    expect(env.get('DIFFERENT_KEY')).toBe('new value');

    vi.unstubAllEnvs();
    vi.stubEnv('DIFFERENT_KEY', 'different value');

    expect(env.get('DIFFERENT_KEY')).toBe('new value'); // should cache-hit
  });

});
