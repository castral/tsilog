import type { UserConfig } from '../configuration.ts';
import type { MapperFactory } from '../mapper/mapper.ts';

export interface ConsoleTransporterConfig extends UserConfig {
  impl?: Console;
}

// TODO: match severity
export const consoleTransporterFactory: MapperFactory<ConsoleTransporterConfig, string[] | Promise<string[]>, void> =
  (config) => {
    const console = config.impl ?? globalThis.console;

    return (logs) => {
      globalThis.console.debug('inside console.transporter');

      const emitOutput = (output: string[]) => {
        output.map((log) => {
          console.log(log);
        });
      };

      if (logs instanceof Promise) {
        logs.then((output) => {
          emitOutput(output);
        }).catch((error: unknown) => {
          console.error(error);
        });
      } else {
        emitOutput(logs);
      }
    };
  };
