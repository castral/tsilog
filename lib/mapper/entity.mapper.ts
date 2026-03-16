import type { UserConfig } from '../configuration/tsilog.config.ts';
import type { MapperFactory } from './mapper.ts';

import { isCode, isName, type Log, SeverityCode } from '../facade.ts';

// This mapper is the default entrypoint to most tsilog chains
export const entityMapperFactory: MapperFactory<UserConfig, unknown[], Log[]> =
  (config) => {
    // TODO: Lots of type coercion. So much coercion to do.
    return (args) => {
      const maybeSeverity = args.shift();
      const severity = isCode(maybeSeverity) || isName(maybeSeverity)
                       ? maybeSeverity
                       : config.defaultSeverity ?? SeverityCode.info;

      console.debug('inside entity.mapper');

      // TODO: Figure out if we're always returning a single Log value and if there is any merit to an array here
      return [{
        arguments: args,
        severity,

        toString: () => {
          const values = args.map((arg) => {
            return typeof arg === 'string' ? arg : JSON.stringify(arg);
          });

          return values.join('');
        },
      }];
    };
  };
