import { afterEach, describe, it, vi } from 'vitest';

import {
  BuiltinFeature,
  configureConsole, SeverityName,
  tsilog,
} from './index.ts';

describe('tsilog', () => {
  afterEach(() => vi.resetAllMocks());

  it('should use a given console implementation', ({ expect }) => {
    expect.assertions(2);

    const mockLogger = vi.fn<(...args: unknown[]) => void>((...args: unknown[]) => {
      expect(args.length).toBeGreaterThan(0);
    });

    const mockConsole = {
      info: mockLogger,
      warn: mockLogger,
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

    logger.info('info', 1, 2, 3, 'another test');
    subLogger.warn('warn', 1, 2, 3, 'another test');
  });

  it('should obey configuration disabled', async ({ expect }) => {
    expect.assertions(1);

    const mockConsole = {
      info: vi.fn<() => void>(() => {
        expect.fail('this should not be called');
      }),
    };

    vi.stubEnv('TSILOG_ENABLED', 'false');

    const disabledLogger = tsilog(configureConsole({
      features: {
        [BuiltinFeature.Console]: {
          console: mockConsole,
        },
      },
    }));

    disabledLogger.info('test');

    await vi.waitFor(() => expect(mockConsole.info).not.toHaveBeenCalled());

    vi.unstubAllEnvs();
  });

  it('should obey configuration severity limit', ({ expect }) => {
    expect.assertions(1);

    const mockConsole = {
      [SeverityName.WARN]: vi.fn<(args: unknown[]) => void>((args: unknown[]) => {
        expect(args.length).toBeGreaterThan(0);
      }),
    };

    vi.stubEnv('TSILOG_ENABLED', 'true');

    const limitedLogger = tsilog(configureConsole({
      severityLimit: SeverityName.WARN,

      features: {
        [BuiltinFeature.Console]: {
          console: mockConsole,
        },
      },
    }));

    limitedLogger.info('test');
    limitedLogger.warn('test');

    vi.unstubAllEnvs();
  });

  it('shouldn\'t sublog an unknown object', ({ expect }) => {
    expect.hasAssertions();

    const validLogger = tsilog(configureConsole());

    for (const symbol of Object.getOwnPropertySymbols(validLogger)) {
      vi.spyOn(validLogger, symbol, 'get').mockReturnValue({
        name: 'notValid',
      });
    }

    expect(() => tsilog({ name: 'subLogger' }, validLogger)).toThrow(TypeError);
  });
});
