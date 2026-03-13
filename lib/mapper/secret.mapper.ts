import type { UserConfig } from '../configuration.ts';
import type { Log } from '../facade.ts';
import type { MapperFactory } from './mapper.ts';

export const secretMapperFactory: MapperFactory<UserConfig, Log[], Log[]> =
  (_config) => (input) => {
    // TODO: mask values of input based on config

    console.debug('inside secret.mapper');

    return input;
  };
