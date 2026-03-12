import type { Configuration } from '../configuration.ts';
import type { Log } from '../facade.ts';
import type { MapperFactory } from '../mapper/mapper.ts';
import type { Surrogate } from '../support/string.support.ts';
import type { Formatter } from './formatter.ts';

export const jsonFormatter: MapperFactory<Log[], Surrogate[]> =
  (_config: Partial<Configuration>): Formatter<Surrogate> => {
    return (_logs): Surrogate[] => {

      return [];
    };
  };
