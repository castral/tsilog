import type { MapperFactory } from '../mapper/mapper.ts';

import {
  BuiltinFeature,
  featureConfig,
  featureEnabled,
} from '../configuration/feature.config.ts';
import { type UserConfig } from '../configuration/tsilog.config.ts';

export interface ConsoleFeature {
  console?: globalThis.Console;
}

// TODO: match severity
export const consoleTransporterFactory: MapperFactory<UserConfig, string[] | Promise<string[]>, void> =
  (config) => {
    const feature = featureConfig<ConsoleFeature>(BuiltinFeature.Console, config);
    const enabled = feature === undefined ? true : featureEnabled(feature) ?? true;
    const consoleImpl = feature?.console ?? globalThis.console;

    return (logs) => {
      if (!enabled) {
        return;
      }

      const emitOutput = (output: string[]) => {
        output.map((log) => {
          consoleImpl.log(log);
        });
      };

      if (logs instanceof Promise) {
        logs.then((output) => {
          emitOutput(output);
        }).catch((error: unknown) => {
          consoleImpl.error(error);
        });
      } else {
        emitOutput(logs);
      }
    };
  };
