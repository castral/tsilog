import type { Formatter } from './formatter/formatter.ts';
import type { Reporter } from './reporter/reporter.ts';
import type { Transporter } from './transporter/transporter.ts';

import { LevelCode, type LevelName, type Log } from './facade.ts';
import { templateFormatter } from './formatter/template.formatter.ts';
import { entityMapper } from './mapper/entity.mapper.ts';
import { chain, type Mapper } from './mapper/mapper.ts';
import { metaMapper } from './mapper/meta.mapper.ts';
import { secretMapper } from './mapper/secret.mapper.ts';
import { type Environment, EnvironmentMap } from './support/env.support.ts';

export interface Configuration {
  name: string;
  levelCutoff: LevelCode | LevelName;

  env: Environment;

  mapper: Mapper<unknown[], Log[]>;
  formatter: Formatter;
  reporters: Reporter[];
  transporters: Transporter[];
}

export const defaultMapper: Mapper<unknown[], Log[]> = chain(
  entityMapper,
  metaMapper,
  secretMapper,
);

const defaultConfig = {
  name: 'tsilog',
  levelCutoff: LevelCode.info,
  mapper: defaultMapper,
};

export function consoleConfig(userConfig?: Partial<Configuration>): Configuration {
  return {
    name: userConfig?.name ?? defaultConfig.name,
    levelCutoff: userConfig?.levelCutoff ?? defaultConfig.levelCutoff,

    env: new EnvironmentMap(),

    mapper: userConfig?.mapper ?? defaultConfig.mapper,
    formatter: templateFormatter(userConfig ?? {}),
    reporters: [

    ],
    transporters: [

    ],
  };
}
