import type { UserConfig } from '../configuration.ts';
import type { Log } from '../facade.ts';
import type { MapperFactory } from '../mapper/mapper.ts';

export const callbackTransporterFactory: MapperFactory<UserConfig, Log[] | Promise<Log[]>, void> =
  (_config) => {
    return (_logs) => {};
  };
