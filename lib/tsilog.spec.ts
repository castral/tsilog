import { describe, it, vi } from 'vitest';

import {
  BuiltinFeature,
  configureConsole,
  isName,
  SeverityCode,
  SeverityName,
  tsilog,
} from './index.ts';

describe('tsilog', () => {
  it('should work', ({ expect }) => {
    expect.hasAssertions();

    const mockLogger = vi.fn<(level: SeverityCode | SeverityName, ..._args: unknown[]) => void>((level, ..._args: unknown[]) => {
      expect(isName(level)).toBe(true);
    });
    const mockConsole = {
      log: mockLogger,
      info: mockLogger,
      warn: mockLogger,
      error: mockLogger,
      debug: mockLogger,
      trace: mockLogger,
      fatal: mockLogger,
    };

    const logger = tsilog(configureConsole({
      name: 'main',

      features: {
        [BuiltinFeature.Console]: {
          console: mockConsole,
        },
      },
    }));
    const subLogger = tsilog({ name: 'sub' }, logger);

    logger.info('test', 1, 2, 3, 'another test');
    subLogger.warn('subLogger', 1, 2, 3, 'another test');
  });
});
