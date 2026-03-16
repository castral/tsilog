import type { UserConfig } from '../configuration/tsilog.config.ts';
import type { Log } from '../facade.ts';
import type { MapperFactory } from '../mapper/mapper.ts';
import type { Surrogate } from '../support/string/template.support.ts';

export const yamlFormatter: MapperFactory<UserConfig, Log[], Surrogate[]> =
  (_config) => {
    return (_logs) => {

      return [];
    };
  };
