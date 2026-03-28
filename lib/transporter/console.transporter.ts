import type { ConsoleImpl } from '../configuration/feature.config.ts';
import type { MapperFactory } from '../mapper/mapper.ts';

import { type TsilogConfig } from '../configuration/tsilog.config.ts';
import { type Log, isCode, toName } from '../facade.ts';

export const consoleTransporterFactory: MapperFactory<Omit<TsilogConfig, 'flume'>, Log[] | Promise<Log[]>, void> =
  (config) => {
    const feature = config.features.console;
    const enabled = feature.enabled ?? true;
    const consoleImpl: ConsoleImpl = feature.implementation ?? globalThis.console;

    return (logs) => {
      if (!enabled) {
        globalThis.console.debug('console transporter disabled');
        return;
      }

      const emitOutput = (output: Log[]) => {
        output.map((log) => {
          consoleImpl[isCode(log.severity)
                      ? toName(log.severity)
                      : log.severity](...log.entities);
        });
      };

      if (logs instanceof Promise) {
        logs.then((output) => {
          emitOutput(output);
        }).catch((error: unknown) => {
          globalThis.console.error('Error encountered', error);
        });
      } else {
        emitOutput(logs);
      }
    };
  };
