import { describe, it } from 'vitest';

import { BuiltinFeature } from '../configuration/feature.config.ts';
import { configureConsole } from '../configuration/premade.config.ts';
import { SeverityName } from '../facade.ts';
import { MetaKey, metaMapperFactory } from './meta.mapper.ts';

describe('meta.mapper', () => {
  it('should default capture TRACE stack traces', ({ expect }) => {
    expect.hasAssertions();

    const mapper = metaMapperFactory(configureConsole());

    const logs = mapper([
      {
        severity: SeverityName.TRACE,
        arguments: ['test'],
      },
      {
        severity: SeverityName.DEBUG,
        arguments: ['test'],
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

    const mapper = metaMapperFactory(configureConsole({
      features: {
        [BuiltinFeature.Mapping]: {
          captureStack: false,
        },
      },
    }));

    const logs = mapper([
      {
        severity: SeverityName.TRACE,
        arguments: ['test'],
      },
    ]);

    expect(logs).toHaveLength(1);

    const log = logs.at(0);

    expect(log?.severity).toBe(SeverityName.TRACE);
    expect(log?.context?.get(MetaKey.Stack)).toBe(null);
  });

  it('should disable all mapping', ({ expect }) => {
    expect.hasAssertions();

    const mapper = metaMapperFactory(configureConsole({
      features: {
        [BuiltinFeature.Mapping]: {
          enabled: false,
        },
      },
    }));

    const logs = mapper([
      {
        severity: SeverityName.TRACE,
        arguments: ['test'],
      },
    ]);

    expect(logs).toHaveLength(1);

    const log = logs.at(0);

    expect(log?.severity).toBe(SeverityName.TRACE);
    expect(log?.context).toBeUndefined();
  });

  it('should always capture a stack trace', ({ expect }) => {
    expect.assertions(5);

    const mapper = metaMapperFactory(configureConsole({
      features: {
        [BuiltinFeature.Mapping]: {
          captureStack: true,
        },
      },
    }));

    const logs = mapper([
      {
        severity: SeverityName.INFO,
        arguments: ['test'],
      },
      {
        severity: SeverityName.TRACE,
        arguments: ['test'],
      },
      {
        severity: SeverityName.DEBUG,
        arguments: ['test'],
      },
      {
        severity: SeverityName.WARN,
        arguments: ['test'],
      },
      {
        severity: SeverityName.ERROR,
        arguments: ['test'],
      },
    ]);

    for (const log of logs) {
      expect(log.context?.get(MetaKey.Stack)).toBeTypeOf('string');
    }
  });

  it('should redefine which severity to capture a stack trace', ({ expect }) => {
    expect.hasAssertions();

    const mapper = metaMapperFactory(configureConsole({
      features: {
        [BuiltinFeature.Mapping]: {
          captureStack: SeverityName.WARN,
        },
      },
    }));

    const logs = mapper([
      {
        severity: SeverityName.TRACE,
        arguments: ['test'],
      },
      {
        severity: SeverityName.WARN,
        arguments: ['test'],
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
