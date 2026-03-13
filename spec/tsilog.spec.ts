import { describe, it } from 'vitest';

import { consoleConfig, tsilog } from '../lib/index.ts';

describe('tsilog', () => {
  it('should work', () => {
    const logger = tsilog(consoleConfig({ name: 'main' }));
    const subLogger = tsilog({ name: 'sub' }, logger);
    console.debug(logger);
    console.debug(subLogger);

    logger.info('test', 1, 2, 3, 'another test');
    subLogger.warn('subLogger', 1, 2, 3, 'another test');
  });
});
