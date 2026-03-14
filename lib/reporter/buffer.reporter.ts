import type { UserConfig } from '../configuration.ts';
import type { Log } from '../facade.ts';
import type { MapperFactory } from '../mapper/mapper.ts';

// TODO: Decide if we want to do an rxjs pipeline impl here
export const bufferReporterFactory: MapperFactory<UserConfig, Log[], Promise<string[]>> =
  (_config) => {
    return (logs) => {
      console.debug('inside buffer.reporter');

      return Promise.resolve(logs.map((log) => log.toString()));
    };
  };
