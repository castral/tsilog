import { describe, it } from 'vitest';

import { metaMapperFactory } from './meta.mapper.ts';

describe('meta.mapper', () => {
  it('should map meta data to context', ({ expect }) => {
    expect.hasAssertions();

    const mapper = metaMapperFactory({});
  });
});
