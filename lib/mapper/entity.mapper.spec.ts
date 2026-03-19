import { describe, type ExpectStatic, it } from 'vitest';

import { BuiltinFeature } from '../configuration/feature.config.ts';
import { type Log, SeverityCode, SeverityName } from '../facade.ts';
import { entityMapperFactory } from './entity.mapper.ts';

function checkArgs(expect: ExpectStatic, level: SeverityCode | SeverityName | undefined, args: unknown[], defaultSeverity: SeverityCode | SeverityName): Log[] {
  expect(args.length).toBeGreaterThan(0);

  const mapper = entityMapperFactory({
    defaultSeverity: defaultSeverity,
    name: '',
    nameSeparator: '',
    severityLimit: SeverityCode.trace,
    features: {
      [BuiltinFeature.Console]: true,
      [BuiltinFeature.Strings]: true,
    },
  });

  const logs = mapper((level === undefined) ? [...args] : [level, ...args]);

  expect(logs).toHaveLength(1);

  const log = logs[0];

  expect(log?.severity).toBe(level ?? defaultSeverity);
  expect(log?.arguments).toHaveLength(args.length);
  expect(log?.arguments).toStrictEqual(args);

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
    expect(logs[0]?.arguments).toHaveLength(args.length);
    expect(logs[0]?.arguments[0]).toStrictEqual('third');
    expect(logs[0]?.toString()).toStrictEqual(args.join(''));
  });
});
