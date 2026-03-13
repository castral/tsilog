import { Enum } from '@castral/ts-enum';

import { subLoggerConfig, type TsilogConfig, type UserConfig } from './configuration.ts';
import { type Facade, type Log, SeverityCode, SeverityName, toCode } from './facade.ts';
import { chain } from './mapper/mapper.ts';

function createLogger<LogType extends Log[] = Log[], WireType = unknown[]>
  (config: TsilogConfig<LogType, WireType>): Facade {

  const pipeline = chain(
    config.mapperStage,
    config.formatterStage,
    config.reporterStage,
    config.transportStage,
  );

  const severityLimit = Enum.isValue(SeverityCode, config.severityLimit)
                        ? config.severityLimit
                        : toCode(config.severityLimit);

  const logImpl = (severity: SeverityCode | SeverityName, ...args: unknown[]): Facade => {
    const logSeverity = Enum.isValue(SeverityCode, severity)
                        ? severity
                        : toCode(severity);
    console.debug('inside logImpl');
    if (!config.env.isEnabled || logSeverity >= severityLimit) {
      return logger;
    }

    const result = pipeline([severity, ...args]);

    if (result instanceof Promise) {
      result.then(() => {
        console.debug('async logImpl finished');
      }).catch((error: unknown) => {
        console.error(error);
      });
    }

    console.debug('sync logImpl finished');

    return logger;
  };

  const addSeverityFacades = (severities: SeverityName[] = Enum.values(SeverityName),
                              logger: Facade = {} as Facade): Facade => {
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

const ConfigKey = Symbol('tsilog.config');

function getConfigurationFrom<LogType extends Log[] = Log[], WireType = unknown[]>
  (logger: Facade): TsilogConfig<LogType, WireType> {

  // ConfigKey is guaranteed to be defined on a Facade
  return logger[ConfigKey] as TsilogConfig<LogType, WireType>;
}

export function tsilog<LogType extends Log[] = Log[], WireType = unknown[]>
  (...args:
     | [config: TsilogConfig<LogType, WireType>]
     | [config: UserConfig, parent: Facade]
  ): Facade {

  if (args.length === 1) {
    const [config] = args;
    return createLogger(config);
  }

  // create a subLogger
  const [config, parent] = args;
  const subConfig = subLoggerConfig(getConfigurationFrom(parent), config);

  return createLogger(subConfig);
}
