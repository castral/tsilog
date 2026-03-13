import type { UserConfig } from '../configuration.ts';
import type { Log } from '../facade.ts';
import type { MapperFactory } from '../mapper/mapper.ts';
import type { Formatter } from './formatter.ts';

import { Surrogate } from '../support/string.support.ts';

export const templateFormatterFactory: MapperFactory<UserConfig, Log[], Surrogate[]> =
  (_config): Formatter<Surrogate[]> => {
    return (logs) => {
      console.debug('inside template.formatter');

      return logs.map((log) => new Surrogate(log, ''));
    };
  };
