import type { UserConfig } from '../configuration/tsilog.config.ts';
import type { MapperFactory } from '../mapper/mapper.ts';

export const fetchTransporterFactory: MapperFactory<UserConfig, string[] | Promise<string[]>, Promise<void>> =
  (_config) => {
    return (_logs) => {
      return Promise.resolve();
    };
  };
