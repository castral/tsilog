import type { Reporter } from './reporter/reporter.ts';
import type { Surrogate } from './support/string.support.ts';
import type { Transporter } from './transporter/transporter.ts';

import { LevelCode, type LevelName, type Log } from './facade.ts';
import { templateFormatter } from './formatter/template.formatter.ts';
import { entityMapper } from './mapper/entity.mapper.ts';
import { chain, type Mapper } from './mapper/mapper.ts';
import { metaMapper } from './mapper/meta.mapper.ts';
import { secretMapper } from './mapper/secret.mapper.ts';
import { type Environment, EnvironmentMap } from './support/env.support.ts';

export interface Configuration<Out = never> {
  name: string;
  levelCutoff: LevelCode | LevelName;

  env: Environment;

  mapper: Mapper<unknown[], Out[]>;
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

// chain MapperFactory together, each taking a config instance to emit Mapper<In, Out>

export function consoleConfig(userConfig?: Partial<Configuration>): Configuration<Surrogate> {
  return {
    name: userConfig?.name ?? defaultConfig.name,
    levelCutoff: userConfig?.levelCutoff ?? defaultConfig.levelCutoff,

    env: new EnvironmentMap(),

    mapper: chain(
      userConfig?.mapper ?? defaultConfig.mapper,
      templateFormatter(userConfig ?? {}),
    ),
    reporters: [

    ],
    transporters: [

    ],
  };
}
