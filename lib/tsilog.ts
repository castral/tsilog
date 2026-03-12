import { Enum } from '@castral/ts-enum';

import type { Configuration } from './configuration.ts';

import { type Facade, LevelCode, LevelName, toCode } from './facade.ts';

export function tsilog(config: Configuration): Facade {

  const makeFacade = (levels: LevelName[] = Enum.values(LevelName),
                      logger: Facade = {} as Facade): Facade => {
    const level = levels.shift();
    if (level === undefined) {
      return logger;
    }

    return makeFacade(levels, {
      ...logger,
      [level]: (...args: unknown[]): Facade => log(level, ...args),
    });
  };

  const logger = makeFacade();

  const log = (level: LevelCode | LevelName, ...args: unknown[]): Facade => {
    const logLevel = Enum.isValue(LevelCode, level) ? level : toCode(level);
    const filterLevel = Enum.isValue(LevelCode, config.levelCutoff)
                        ? config.levelCutoff
                        : toCode(config.levelCutoff);

    if (!config.env.isEnabled || logLevel < filterLevel) {
      return logger;
    }

    const logs = config.mapper([level, ...args]);
    const reportedLogs = config.reporters.map((reporter) => reporter(logs));

    // TODO: Figure out mapping between Reporter[] and Transporter[]
    for (const transporter of config.transporters) {
      for (const outputLogs of reportedLogs) {
        void transporter(outputLogs);
      }
    }

    return logger;
  };

  return logger;
}

export * from './configuration.ts';
