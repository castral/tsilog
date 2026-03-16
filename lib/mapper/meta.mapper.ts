import type { UserConfig } from '../configuration/tsilog.config.ts';
import type { Log } from '../facade.ts';
import type { MapperFactory } from './mapper.ts';

export enum MetaKey {
  Time = 'time',
}

export const metaMapperFactory: MapperFactory<UserConfig, Log[], Log[]> =
  (_config) => (input) => {
  return input.map((log) => {
    console.debug('inside meta.mapper');

    if (log.context === undefined) {
      log.context = new Map();

      log.context.set(MetaKey.Time, Date.now());
    }

    return log;
  });
};
