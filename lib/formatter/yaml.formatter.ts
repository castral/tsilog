import type { UserConfig } from '../configuration.ts';
import type { Log } from '../facade.ts';
import type { MapperFactory } from '../mapper/mapper.ts';
import type { Surrogate } from '../support/string.support.ts';

export const yamlFormatter: MapperFactory<UserConfig, Log[], Surrogate[]> =
  (_config) => {
    return (_logs) => {

      return [];
    };
  };
