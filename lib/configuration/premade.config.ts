import type { Log } from '../facade.ts';

import { templateFormatterFactory } from '../formatter/template.formatter.ts';
import { entityMapperFactory } from '../mapper/entity.mapper.ts';
import { chain, type Mapper } from '../mapper/mapper.ts';
import { metaMapperFactory } from '../mapper/meta.mapper.ts';
import { secretMapperFactory } from '../mapper/secret.mapper.ts';
import { bufferReporterFactory } from '../reporter/buffer.reporter.ts';
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

export function configureConsole(userConfig?: UserConfig): TsilogConfig {
  return createTsilogConfig({
    ...defaultUserConfig,
    ...userConfig,

    features: {
      ...defaultUserConfig.features,
      ...userConfig?.features,
    },
  }, {
    flume: chain(
      consoleMapperFactory(userConfig ?? defaultUserConfig),
      templateFormatterFactory(userConfig ?? defaultUserConfig),
      bufferReporterFactory(userConfig ?? defaultUserConfig),
      consoleTransporterFactory(userConfig ?? defaultUserConfig),
    ),
  });
}
