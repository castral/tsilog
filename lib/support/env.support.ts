/// <reference types="vite/client" />
import { Enum } from '@castral/ts-enum';

export const TSILOG_ENV_PREFIX = 'TSILOG_' as const;
export type TsilogEnvKey = `${typeof TSILOG_ENV_PREFIX}${string}`;

export function makeTsilogEnvKey(key: string): TsilogEnvKey {
  return key.startsWith(TSILOG_ENV_PREFIX)
         ? key as TsilogEnvKey
         : `${TSILOG_ENV_PREFIX}${key.toUpperCase()}`;
}

export enum EnvironmentProperty {
  Asserts = 'asserts',
  Browser = 'browser',
  Bun = 'bun',
  CI = 'ci',
  Debug = 'debug',
  Deno = 'deno',
  Enabled = 'enabled',
  Node = 'node',
  Production = 'production',
  Test = 'test',
  Worker = 'worker',
}

interface EnvFacade {
  env?: Record<string, string | undefined>;
}

interface Versions {
  versions?: Record<string, string | undefined>;
}

interface GlobalEnvironment {
  document?: Document;
  meta?: EnvFacade;
  navigator?: Navigator | WorkerNavigator;
  process?: EnvFacade & Versions;
  window?: Window & typeof globalThis;
}

export interface Environment {
  asserts: boolean;
  isBrowser: boolean;
  isBun: boolean;
  isCI: boolean;
  isDebug: boolean;
  isDeno: boolean;
  isEnabled: boolean;
  isNode: boolean;
  isProduction: boolean;
  isTest: boolean;
  isWorker: boolean;

  get(key: string): boolean | string | undefined;
}

export class EnvironmentMap implements Environment {
  private static defaultFlags = {
    asserts: true,
    browser: false,
    bun: false,
    ci: false,
    debug: false,
    deno: false,
    enabled: true,
    node: false,
    production: false,
    test: false,
    worker: false,
  };
  private _globals: GlobalEnvironment | undefined;
  #boolCache: Record<EnvironmentProperty, boolean> | undefined;
  #strCache: Map<string, boolean | string> = new Map();

  private get globals(): GlobalEnvironment {
    return this._globals ??= {
      document: globalThis.document,
      meta: import.meta,
      navigator: globalThis.navigator,
      process: globalThis.process,
      window: globalThis.window,
    };
  }

  public get asserts(): boolean {
    return this.#getAndCache(EnvironmentProperty.Asserts);
  }

  public get isBrowser(): boolean {
    return this.#getAndCache(EnvironmentProperty.Browser);
  }

  public get isBun(): boolean {
    return this.#getAndCache(EnvironmentProperty.Bun);
  }

  public get isCI(): boolean {
    return this.#getAndCache(EnvironmentProperty.CI);
  }

  public get isDebug(): boolean {
    return this.#getAndCache(EnvironmentProperty.Debug);
  }

  public get isDeno(): boolean {
    return this.#getAndCache(EnvironmentProperty.Deno);
  }

  public get isEnabled(): boolean {
    return this.#getAndCache(EnvironmentProperty.Enabled);
  }

  public get isNode(): boolean {
    return this.#getAndCache(EnvironmentProperty.Node);
  }

  public get isProduction(): boolean {
    return this.#getAndCache(EnvironmentProperty.Production);
  }

  public get isTest(): boolean {
    return this.#getAndCache(EnvironmentProperty.Test);
  }

  public get isWorker(): boolean {
    return this.#getAndCache(EnvironmentProperty.Worker);
  }

  #getAndCache(key: EnvironmentProperty): boolean {
    if (this.#boolCache === undefined) {
      const flags: Record<EnvironmentProperty, boolean> = {
        ...EnvironmentMap.defaultFlags,
      };

      for (const property of Enum.values(EnvironmentProperty)) {
        switch (property) {
          case EnvironmentProperty.Asserts: {
            flags[property] = this.getTsilogFlagFromEnv(property) ?? flags[property];
            break;
          }
          case EnvironmentProperty.Browser: {
            flags[property] = this.globals.window !== undefined && this.globals.document !== undefined;
            break;
          }
          case EnvironmentProperty.Bun: {
            flags[property] = this.globals.process?.versions?.['bun'] !== undefined;
            break;
          }
          case EnvironmentProperty.CI: {
            flags[property] = this.valueFromEnv('CI') === 'true';
            break;
          }
          case EnvironmentProperty.Debug: {
            flags[property] = this.getTsilogFlagFromEnv(property) ?? flags[property];
            break;
          }
          case EnvironmentProperty.Deno: {
            flags[property] = this.globals.process?.versions?.['deno'] !== undefined;
            break;
          }
          case EnvironmentProperty.Enabled: {
            flags[property] = this.getTsilogFlagFromEnv(property) ?? flags[property];
            break;
          }
          case EnvironmentProperty.Node: {
            flags[property] = this.globals.process?.versions?.['node'] !== undefined;
            break;
          }
          case EnvironmentProperty.Production: {
            flags[property] = this.valueFromEnv('NODE_ENV') === 'production';
            break;
          }
          case EnvironmentProperty.Test: {
            flags[property] = this.valueFromEnv('NODE_ENV') === 'test';
            break;
          }
          case EnvironmentProperty.Worker: {
            flags[property] = 'WorkerGlobalScope' in globalThis
              || 'importScripts' in globalThis
              || (this.globals.navigator?.userAgent.includes('Cloudflare-Workers') ?? false);
            break;
          }
          // no default (enum is exhaustive)
        }
      }

      this.#boolCache = flags;
    }

    return this.#boolCache[key];
  }

  public get(key: string): boolean | string | undefined {
    let value = this.#strCache.get(key);
    if (value === undefined) {
      value = this.getTsilogFlagFromEnv(key) ?? this.valueFromEnv(key.toUpperCase());
      if (value !== undefined) {
        this.#strCache.set(key, value);
      }
    }
    return value;
  }

  private valueFromEnv(value: string): string | undefined {
    return this.globals.meta?.env?.[value] ?? this.globals.process?.env?.[value];
  }

  private getTsilogFlagFromEnv(key: string): boolean | undefined {
    const flag = this.valueFromEnv(makeTsilogEnvKey(key));

    return (flag === undefined) ? undefined : flag === 'true';
  }
}
