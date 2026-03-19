import type { MapperFactory } from '../mapper/mapper.ts';

import {
  BuiltinFeature,
  featureConfigFromConfig,
  isFeatureEnabled,
} from '../configuration/feature.config.ts';
import { type UserConfig } from '../configuration/tsilog.config.ts';
import { type Log, isCode, SeverityName, toName } from '../facade.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConsoleImpl = Record<SeverityName, (...args: any[]) => void>;

export interface ConsoleFeature {
  console?: ConsoleImpl;
}

export const consoleTransporterFactory: MapperFactory<UserConfig, Log[] | Promise<Log[]>, void> =
  (config) => {
    const feature = featureConfigFromConfig<ConsoleFeature>(BuiltinFeature.Console, config);
    const enabled = feature === undefined ? true : isFeatureEnabled(BuiltinFeature.Console, config) ?? true;
    const consoleImpl: ConsoleImpl = feature?.console ?? globalThis.console;

    return (logs) => {
      if (!enabled) {
        globalThis.console.debug('console transporter disabled');
        return;
      }

      const emitOutput = (output: Log[]) => {
        output.map((log) => {
          consoleImpl[isCode(log.severity)
                      ? toName(log.severity)
                      : log.severity](...log.arguments);
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
