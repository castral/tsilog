import { SeverityCode, type SeverityName } from '../facade.ts';
import { templateFormatterFactory } from '../formatter/template.formatter.ts';
import { entityMapperFactory } from '../mapper/entity.mapper.ts';
import { chain, type Mapper } from '../mapper/mapper.ts';
import { bufferReporterFactory } from '../reporter/buffer.reporter.ts';
import { type Environment, EnvironmentMap } from '../support/env.support.ts';
import { consoleTransporterFactory } from '../transporter/console.transporter.ts';
import { type BuiltinFeatures } from './feature.config.ts';

const isConfigKey = Symbol('tsilog.isConfig');

// This configuration interface is offered for user convenience
export interface UserConfig {
  name?: string;
  nameSeparator?: string;
  severityLimit?: SeverityCode | SeverityName;
  defaultSeverity?: SeverityCode | SeverityName;

  features?: BuiltinFeatures;
}

// This is the effective default configuration fallback for all configurations
export const defaultUserConfig: Required<UserConfig> = {
  name: 'tsilog',
  nameSeparator: '.',
  severityLimit: SeverityCode.info,
  defaultSeverity: SeverityCode.info,

  features: {
    console: {
      enabled: true,
    },
    mapper: {
      enabled: true,
    },
    string: {
      enabled: true,
    },
  },
};

// This is a concrete representation of any complete logger configuration
export interface TsilogConfig extends Required<UserConfig>, Record<symbol, unknown> {

  env: Environment;

  isSubLogger: boolean;

  flume: Mapper<unknown[], void | Promise<void>>;
}

export function createTsilogConfig(
  config: Omit<TsilogConfig, 'env' | 'flume' | 'isSubLogger' | symbol>,
  userFlume?: Pick<TsilogConfig, 'flume'>,
): TsilogConfig {

  const tsilogConfig = {
    ...config,

    env: new EnvironmentMap(),

    isSubLogger: false,
    [isConfigKey]: true,
  };

  return {
    ...tsilogConfig,

    flume: userFlume?.flume ?? chain(
      entityMapperFactory(tsilogConfig),
      templateFormatterFactory(tsilogConfig),
      bufferReporterFactory(tsilogConfig),
      consoleTransporterFactory(tsilogConfig),
    ),
  };
}

export function createSubTsilogConfig(parent: TsilogConfig, subConfig?: UserConfig): TsilogConfig {

  const separator = subConfig?.nameSeparator ?? defaultUserConfig.nameSeparator;
  const subName = subConfig?.name ?? `sub${defaultUserConfig.name}`;
  const name = `${parent.name}${separator}${subName}`;

  return {
    ...parent,
    ...subConfig ?? defaultUserConfig,

    name,

    isSubLogger: true,
  };
}

export function isTsilogConfig(value: unknown): value is TsilogConfig {
  return value != null &&
    typeof value === 'object' &&
    isConfigKey in value &&
    value[isConfigKey] === true;
}
