import { describe, it } from 'vitest';

import { consoleConfig } from '../lib/configuration.ts';
import { tsilog } from '../lib/tsilog.ts';

describe('tsilog', () => {
  it('should work', () => {
    const logger = tsilog(consoleConfig());
    console.debug(logger);
  });
});
