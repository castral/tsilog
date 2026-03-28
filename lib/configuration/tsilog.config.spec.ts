import { afterEach, describe, it, vi } from 'vitest';

import type { ConsoleFeature } from '../transporter/console.transporter.ts';

import { type Log, SeverityName } from '../facade.ts';
import { entityMapperFactory } from '../mapper/entity.mapper.ts';
import { chain, type Mapper } from '../mapper/mapper.ts';
import { tsilog } from '../tsilog.ts';
import { configureConsole } from './premade.config.ts';
import { createSubTsilogConfig, createTsilogConfig } from './tsilog.config.ts';

describe('configuration', () => {
  afterEach(() => vi.resetAllMocks());

  it('should override the default flume', async ({ expect }) => {
    expect.hasAssertions();

    const userConfig = {
      name: 'flume override',
    };

    const mapper = vi.fn<Mapper<Log[], Promise<void>>>((_input: Log[]): Promise<void> => {
      return Promise.resolve();
    });

    const myFlume = chain(
      entityMapperFactory(configureConsole(userConfig)),
      mapper,
    );

    const config = createTsilogConfig(configureConsole(), { flume: myFlume });

    const logger = tsilog(config);
    logger.info('test');

    await vi.waitFor(() => expect(mapper)
      .toHaveBeenCalledExactlyOnceWith([
        expect.objectContaining(
          {
            arguments: [
              'test',
            ],
            severity: SeverityName.INFO,
          }),
      ]));
  });

  it('should use the default flume', ({ expect }) => {
    expect.hasAssertions();

    const config = createTsilogConfig(configureConsole());

    expect(config.flume).toBeInstanceOf(Function);
  });

  it('should have a default subname for subloggers', ({ expect }) => {
    expect.hasAssertions();

    const config = createTsilogConfig(configureConsole({ name: 'parent' }));

    const subConfig = createSubTsilogConfig(config); // use default sublogger name

    expect(subConfig.name).toBe('parent.subtsilog');
  });

});
