import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { EnvironmentMap, EnvironmentProperty, makeTsilogEnvKey } from './env.support.ts';

function stubNonDefaultValues(pairs: ([string, string])[]) {
  vi.spyOn(process, 'versions', 'get').mockReturnValue({
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
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  afterAll(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('should return the correct overridden value', () => {
    stubNonDefaultValues([
      [makeTsilogEnvKey(EnvironmentProperty.Asserts), 'false'],
      [makeTsilogEnvKey(EnvironmentProperty.Debug), 'true'],
      [makeTsilogEnvKey(EnvironmentProperty.Enabled), 'false'],
      [EnvironmentProperty.CI.toUpperCase(), 'true'],
    ]);

    const map = new EnvironmentMap();
    expect(map.asserts).toBeFalsy(); // false
    expect(map.isDebug).toBeTruthy();
    expect(map.isEnabled).toBeFalsy(); // false
    expect(map.isCI).toBeTruthy();
    expect(map.isBun).toBeTruthy();
    expect(map.isBrowser).toBeTruthy();
    expect(map.isDeno).toBeTruthy();
    expect(map.isNode).toBeTruthy();
  });

  it('should return default values by default', () => {
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    vi.stubGlobal('process', undefined);

    const map = new EnvironmentMap();
    expect(map.asserts).toBeTruthy(); // true
    expect(map.isDebug).toBeFalsy();
    expect(map.isEnabled).toBeTruthy(); // true
    expect(map.isCI).toBeFalsy();
    expect(map.isBun).toBeFalsy();
    expect(map.isBrowser).toBeFalsy();
    expect(map.isDeno).toBeFalsy();
    expect(map.isNode).toBeFalsy();
  });

  it('should return true only for specific node envs', () => {
    // BUG: despite having the same call in `beforeEach`/`afterAll` we still need this
    vi.unstubAllGlobals();

    vi.stubEnv('NODE_ENV', 'dev');
    expect(new EnvironmentMap().isProduction).toBeFalsy();
    expect(new EnvironmentMap().isTest).toBeFalsy();
    vi.stubEnv('NODE_ENV', 'production');
    expect(new EnvironmentMap().isProduction).toBeTruthy();
    expect(new EnvironmentMap().isTest).toBeFalsy();
    vi.stubEnv('NODE_ENV', 'test');
    expect(new EnvironmentMap().isProduction).toBeFalsy();
    expect(new EnvironmentMap().isTest).toBeTruthy();
  });

});
