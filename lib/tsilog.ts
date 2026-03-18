import { Enum } from '@castral/ts-enum';

import {
  createSubTsilogConfig,
  isTsilogConfig,
  type TsilogConfig,
  type UserConfig,
} from './configuration/tsilog.config.ts';
import { type Facade, SeverityCode, SeverityName, toCode } from './facade.ts';

const ConfigKey = Symbol('tsilog.config');

function createLogger(config: TsilogConfig): Facade {

  const severityLimit = Enum.isValue(SeverityCode, config.severityLimit)
                        ? config.severityLimit
                        : toCode(config.severityLimit);

  const logImpl = (severity: SeverityName, ...args: unknown[]): Facade => {
    const logSeverity = toCode(severity);
    if (!config.env.isEnabled || logSeverity < severityLimit) {
      return logger;
    }

    const _result = config.flume([severity, ...args]);

    // TODO: When async transport is ready:
    // if (result instanceof Promise) {
    //   result.then(() => {
    //     globalThis.console.debug('async logImpl finished');
    //   }).catch((error: unknown) => {
    //     globalThis.console.error(error);
    //   });
    // }

    globalThis.console.debug('sync logImpl finished');

    return logger;
  };

  const addSeverityFacades = (severities: SeverityName[] = Enum.values(SeverityName), logger: Facade = {} as Facade): Facade => {

    const severity = severities.shift();
    if (severity === undefined) {
      return logger;
    }

    return addSeverityFacades(severities, {
      ...logger,
      [severity]: (...args: unknown[]): Facade => logImpl(severity, ...args),
    });
  };

  const logger = addSeverityFacades();

  // Associate this facade instance with this configuration
  logger[ConfigKey] = config;

  return logger;
}

function getConfigurationFrom(logger: Facade): TsilogConfig {
  const config = logger[ConfigKey];
  return isTsilogConfig(config)
         ? config
         : throwInvalidConfig(config);
}

// TODO: Introduce our own Error subtype
function throwInvalidConfig(c: unknown): never {
  throw new TypeError(`Invalid Config ${JSON.stringify(c)}`);
}

export function tsilog
  (...args:
     | [config: TsilogConfig]
     | [config: UserConfig, parent: Facade]
  ): Facade {

  if (args.length === 1) {
    const [config] = args;
    return createLogger(config);
  }

  // create a subLogger
  const [config, parent] = args;
  const subConfig = createSubTsilogConfig(getConfigurationFrom(parent), config);

  return createLogger(subConfig);
}
