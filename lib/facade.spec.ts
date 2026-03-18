import { Enum } from '@castral/ts-enum';
import { describe, it } from 'vitest';

import { SeverityCode, SeverityName, toCode, toName } from './facade.ts';

describe('facade', () => {
  it('should convert severities', ({ expect }) => {
    expect.hasAssertions();

    for (const value of Enum.values(SeverityName)) {
      expect(Enum.isValue(SeverityName, value)).toBe(true);
      expect(Enum.isValue(SeverityCode, toCode(value))).toBe(true);
    }

    for (const value of Enum.values(SeverityCode)) {
      expect(Enum.isValue(SeverityCode, value)).toBe(true);
      expect(Enum.isValue(SeverityName, toName(value))).toBe(true);
    }
  });

  it('should reject invalid severities', ({ expect }) => {
    expect.hasAssertions();

    expect(toCode('invalid' as unknown as SeverityName)).toBeUndefined();
    expect(toCode('' as unknown as SeverityName)).toBeUndefined();
    expect(toCode('infos' as unknown as SeverityName)).toBeUndefined();
    expect(toCode('1' as unknown as SeverityName)).toBeUndefined();
    expect(toCode('INFO' as unknown as SeverityName)).toBeUndefined();

    expect(toName(999 as unknown as SeverityCode)).toBeUndefined();
    expect(toName(Number.NaN as unknown as SeverityCode)).toBeUndefined();
    expect(toName(Number.POSITIVE_INFINITY as unknown as SeverityCode)).toBeUndefined();
    expect(toName(Number.MAX_SAFE_INTEGER as unknown as SeverityCode)).toBeUndefined();
    expect(toName(Number.MIN_SAFE_INTEGER as unknown as SeverityCode)).toBeUndefined();
  });
});
