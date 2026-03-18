import type { UserConfig } from '../configuration/tsilog.config.ts';
import type { Log } from '../facade.ts';
import type { MapperFactory } from '../mapper/mapper.ts';
import type { Formatter } from './formatter.ts';

import { Surrogate } from '../support/string/template.support.ts';

export interface TemplateFeature {
  placeholder?: string;
}

export const templateFormatterFactory: MapperFactory<UserConfig, Log[], Log[]> = (_config): Formatter => {
    return (logs) => {
      console.debug('inside template.formatter');

      return logs.map((log) => new Surrogate(log, ''));
    };
  };
