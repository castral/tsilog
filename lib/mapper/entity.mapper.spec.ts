import { describe, type ExpectStatic, it } from 'vitest';

import type { TsilogConfig } from '../configuration/tsilog.config.ts';
import type { Mapper } from './mapper.ts';

import { configureConsole } from '../configuration/premade.config.ts';
import { type Log, SeverityCode, SeverityName } from '../facade.ts';
import { EnvironmentMap } from '../support/env.support.ts';
import { entityMapperFactory } from './entity.mapper.ts';
import { MetaKey } from './mapper-feature.config.ts';

const defaultConfig = {
  isSubLogger: false,
  env: new EnvironmentMap(),

  defaultSeverity: SeverityName.INFO,
  name: '',
  nameSeparator: '',
  severityLimit: SeverityCode.trace,
  features: {
    console: { enabled: true },
    mapper: { enabled: true },
    string: { enabled: true },
  },
};

function createMapper(config: Omit<Partial<TsilogConfig>, 'flume'> = defaultConfig): Mapper<unknown[], Log[]> {
  return entityMapperFactory({
    ...defaultConfig,
    ...config,
  });
}

function checkArgs(expect: ExpectStatic, level: SeverityCode | SeverityName | undefined, args: unknown[], defaultSeverity: SeverityCode | SeverityName): Log[] {
  expect(args.length).toBeGreaterThan(0);

  const mapper = createMapper({
    ...defaultConfig,
    defaultSeverity,
  });

  const logs = mapper((level === undefined) ? [...args] : [level, ...args]);

  expect(logs).toHaveLength(1);

  const log = logs[0];

  expect(log?.severity).toBe(level ?? defaultSeverity);
  expect(log?.entities).toHaveLength(args.length);
  expect(log?.entities).toStrictEqual(args);

  return logs;
}

describe('entity.mapper', () => {
  it('should map severity as argument', ({ expect }) => {
    expect.hasAssertions();

    void checkArgs(expect, SeverityName.INFO, ['first', 'test'], SeverityName.ERROR);

    void checkArgs(expect, SeverityCode.info, ['second', 'test'], SeverityName.ERROR);

    void checkArgs(expect, undefined, ['third', 'test'], SeverityName.ERROR);
  });

  it('should convert toString', ({ expect }) => {
    expect.hasAssertions();

    const args = ['third', 'test', 3];
    const logs = checkArgs(expect, undefined, args, SeverityName.ERROR);

    expect(logs).toHaveLength(1);
    expect(logs[0]?.entities).toHaveLength(args.length);
    expect(logs[0]?.entities[0]).toStrictEqual('third');
    expect(logs[0]?.toString()).toStrictEqual(args.join(''));
  });

  it('should default capture TRACE stack traces', ({ expect }) => {
    expect.hasAssertions();

    const mapper = createMapper();

    const logs = mapper([
      {
        severity: SeverityName.TRACE,
        entities: ['test'],
      },
      {
        severity: SeverityName.DEBUG,
        entities: ['test'],
      },
    ]);

    expect(logs)
      .toHaveLength(2);

    const traceLog = logs.at(0);

    expect(traceLog?.severity).toBe(SeverityName.TRACE);
    expect(traceLog?.context?.get(MetaKey.Stack)).toBeTypeOf('string');

    const debugLog = logs.at(1);

    expect(debugLog?.severity).toBe(SeverityName.DEBUG);
    expect(debugLog?.context?.get(MetaKey.Stack)).toBe(null);
  });

  it('should disable stack trace capture', ({ expect }) => {
    expect.hasAssertions();

    const mapper = createMapper({
      features: {
        console: {},
        mapper: {
          captureStack: false,
        },
        string: {},
      },
    });

    const logs = mapper([
      {
        severity: SeverityName.TRACE,
        entities: ['test'],
      },
    ]);

    expect(logs).toHaveLength(1);

    const log = logs.at(0);

    expect(log?.severity).toBe(SeverityName.TRACE);
    expect(log?.context?.get(MetaKey.Stack)).toBe(null);
  });

  it('should disable all mapping', ({ expect }) => {
    expect.hasAssertions();

    const mapper = entityMapperFactory(configureConsole({
      features: {
        console: {},
        mapper: {
          enabled: false,
        },
        string: {},
      },
    }));

    const logs = mapper([
      {
        severity: SeverityName.TRACE,
        entities: ['test'],
      },
    ]);

    expect(logs).toHaveLength(1);

    const log = logs.at(0);

    expect(log?.severity).toBe(SeverityName.TRACE);
    expect(log?.context).toBeUndefined();
  });

  it('should always capture a stack trace', ({ expect }) => {
    expect.assertions(5);

    const mapper = entityMapperFactory(configureConsole({
      features: {
        console: {},
        mapper: {
          captureStack: true,
        },
        string: {},
      },
    }));

    const logs = mapper([
      {
        severity: SeverityName.INFO,
        entities: ['test'],
      },
      {
        severity: SeverityName.TRACE,
        entities: ['test'],
      },
      {
        severity: SeverityName.DEBUG,
        entities: ['test'],
      },
      {
        severity: SeverityName.WARN,
        entities: ['test'],
      },
      {
        severity: SeverityName.ERROR,
        entities: ['test'],
      },
    ]);

    for (const log of logs) {
      expect(log.context?.get(MetaKey.Stack)).toBeTypeOf('string');
    }
  });

  it('should redefine which severity to capture a stack trace', ({ expect }) => {
    expect.hasAssertions();

    const mapper = entityMapperFactory(configureConsole({
      features: {
        console: {},
        mapper: {
          captureStack: SeverityName.WARN,
        },
        string: {},
      },
    }));

    const logs = mapper([
      {
        severity: SeverityName.TRACE,
        entities: ['test'],
      },
      {
        severity: SeverityName.WARN,
        entities: ['test'],
      },
    ]);

    expect(logs)
      .toHaveLength(2);

    const traceLog = logs.at(0);

    expect(traceLog?.severity).toBe(SeverityName.TRACE);
    expect(traceLog?.context?.get(MetaKey.Stack)).toBe(null);

    const warnLog = logs.at(1);

    expect(warnLog?.severity).toBe(SeverityName.WARN);
    expect(warnLog?.context?.get(MetaKey.Stack)).toBeTypeOf('string');
  });

});
