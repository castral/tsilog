import type { Configuration } from '../configuration.ts';
import type { Log } from '../facade.ts';
import type { MapperFactory } from '../mapper/mapper.ts';
import type { Reporter } from './reporter.ts';

export const bufferReporter: MapperFactory<Log[], Log[] | Promise<Log[]>> =
  (_config: Partial<Configuration>): Reporter => {
    return (_logs): Promise<Log[]> => {

      return Promise.resolve([]);
    };
  };
