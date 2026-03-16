import type { Log } from '../facade.ts';
import type { Surrogate } from '../support/string/template.support.ts';

import { templateFormatterFactory } from '../formatter/template.formatter.ts';
import { entityMapperFactory } from '../mapper/entity.mapper.ts';
import { chain, type Mapper } from '../mapper/mapper.ts';
import { metaMapperFactory } from '../mapper/meta.mapper.ts';
import { secretMapperFactory } from '../mapper/secret.mapper.ts';
import { bufferReporterFactory } from '../reporter/buffer.reporter.ts';
import { EnvironmentMap } from '../support/env.support.ts';
import { consoleTransporterFactory } from '../transporter/console.transporter.ts';
import {
  createTsilogConfig,
  defaultUserConfig,
  type TsilogConfig,
  type UserConfig,
} from './tsilog.config.ts';

const consoleMapperFactory = (userConfig: UserConfig): Mapper<unknown[], Log[]> => chain(
  entityMapperFactory(userConfig),
  metaMapperFactory(userConfig),
  secretMapperFactory(userConfig),
);

export function configureConsole(userConfig?: UserConfig): TsilogConfig<Surrogate[]> {
  return createTsilogConfig({
    ...defaultUserConfig,
    ...userConfig,

    env: new EnvironmentMap(),

    features: {
      ...defaultUserConfig.features,
      ...userConfig?.features,
    },

    mapperStage: consoleMapperFactory(userConfig ?? defaultUserConfig),
    formatterStage: templateFormatterFactory(userConfig ?? defaultUserConfig),
    reporterStage: bufferReporterFactory(userConfig ?? defaultUserConfig),
    transportStage: consoleTransporterFactory(userConfig ?? defaultUserConfig),
  });
}
