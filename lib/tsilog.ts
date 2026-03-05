import { type Facade, LevelCode, LevelName, type LogCall } from './logger.js';
import { chain, type Mapper } from './mapper.js';
import { Transporter } from './transporter.js';

export function tsilog<Log = Record<string, unknown>>(
  userMapper: Mapper<Log[], Log[]> | undefined,
  transporters: Transporter<Log>[] = [],
): Facade {

  const inputMapper = (..._args: unknown[]): Log[] => {
    return [];
  };
  const mapper = (userMapper === undefined)
                 ? inputMapper
                 : chain(inputMapper, userMapper);

  const logger = Object.fromEntries(
    Object.values(LevelName).map((levelName) =>
      [
        levelName,
        (level: LevelCode | LevelName, ...args: unknown[]) => log(level, ...args),
      ],
    ),
  ) as Record<LevelName, LogCall>;

  const log = (level: LevelCode | LevelName, ...args: unknown[]) => {
    const logs = mapper([level, ...args]);
    for (const transporter of transporters) {
      transporter.transport(logs);
    }

    return logger;
  };

  return logger;
}
