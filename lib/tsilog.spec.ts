import { describe, it } from 'vitest';

import { consoleConfig, tsilog } from './index.ts';

describe('tsilog', () => {
  it('should work', () => {
    const logger = tsilog(consoleConfig({ name: 'main' }));
    const subLogger = tsilog({ name: 'sub' }, logger);

    logger.info('test', 1, 2, 3, 'another test');
    subLogger.warn('subLogger', 1, 2, 3, 'another test');
  });
});
