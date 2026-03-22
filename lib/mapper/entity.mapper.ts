import type { TsilogConfig } from '../configuration/tsilog.config.ts';
import type { MapperFactory } from './mapper.ts';

import { isCode, isName, type Log, SeverityCode, SeverityName } from '../facade.ts';

// This mapper is the default entrypoint to most tsilog chains
export const entityMapperFactory: MapperFactory<Omit<TsilogConfig, 'env' | 'flume' | 'isSubLogger'>, unknown[], Log[]> =
  (config) => {
    // TODO: Lots of type coercion. So much coercion to do.
    return (args) => {
      const severity: SeverityCode | SeverityName = isCode(args.at(0))
                                                    ? args.shift() as SeverityCode
                                                    : isName(args.at(0))
                                                      ? args.shift() as SeverityName
                                                      : config.defaultSeverity;

      // TODO: Figure out if we're always returning a single Log value and if there is any
      //  merit to an array here
      return [
        {
          arguments: globalThis.structuredClone(args),
          severity,

          toString: () => {
            const values = args.map((arg) => {
              return typeof arg === 'string' ? arg : JSON.stringify(arg);
            });

            return values.join('');
          },
        },
      ];
    };
  };
