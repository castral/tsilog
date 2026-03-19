import { describe, it } from 'vitest';

import { yamlFormatterFactory } from './yaml.formatter.ts';

describe('yaml.formatter', () => {
  it('should work', ({ expect }) => {
    expect.hasAssertions();

    const formatter = yamlFormatterFactory({});
    const output = formatter([]);

    expect(formatter).toBeDefined();
    expect(output).toHaveLength(0);
  });
});
