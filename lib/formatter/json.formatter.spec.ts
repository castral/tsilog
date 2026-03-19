import { describe, it } from 'vitest';

import { jsonFormatterFactory } from './json.formatter.ts';

describe('json.formatter', () => {
  it('should work', ({ expect }) => {
    expect.hasAssertions();

    const formatter = jsonFormatterFactory({});
    const output = formatter([]);

    expect(formatter).toBeDefined();

    expect(output).toHaveLength(0);
  });
});
