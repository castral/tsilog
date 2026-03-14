import type { Formatter } from './formatter/formatter.ts';
import type { Reporter } from './reporter/reporter.ts';
import type { Surrogate } from './support/string.support.ts';
import type { Transporter } from './transporter/transporter.ts';

import { type Log, SeverityCode, type SeverityName } from './facade.ts';
import { templateFormatterFactory } from './formatter/template.formatter.ts';
import { entityMapperFactory } from './mapper/entity.mapper.ts';
import { chain, type Mapper } from './mapper/mapper.ts';
import { metaMapperFactory } from './mapper/meta.mapper.ts';
import { secretMapperFactory } from './mapper/secret.mapper.ts';
import { bufferReporterFactory } from './reporter/buffer.reporter.ts';
import { type Environment, EnvironmentMap } from './support/env.support.ts';
import { consoleTransporterFactory } from './transporter/console.transporter.ts';

const isConfigKey = Symbol('tsilog.isConfig');
const isSubLoggerKey = Symbol('tsilog.isSubLogger');

// This configuration interface is offered for user convenience
export interface UserConfig {
  name?: string;
  nameSeparator?: string;
  severityLimit?: SeverityCode | SeverityName;
  defaultSeverity?: SeverityCode | SeverityName;
  // TODO: Add stage-specific configuration options
}

// This is the effective default configuration fallback for all configurations
export const defaultUserConfig: Required<UserConfig> = {
  name: 'tsilog',
  nameSeparator: '.',
  severityLimit: SeverityCode.info,
  defaultSeverity: SeverityCode.info,
};

// This is a concrete representation of any complete logger configuration
export interface TsilogConfig<LogType extends Log[] = Log[], WireType = string[]>
  extends Record<symbol, unknown>, Required<UserConfig> {

  env: Environment;

  // The mapper chain that defines a tsilog instance:
  // reason: log a val -> pick a format  -> when/how to emit val -> emit val as side effect
  // input:  unknown[] -> Log[] (in rep) -> LogType[] (out rep)  -> WireType[] (out literal)
  // stage:   Mapper   ->  Formatter[]   ->     Reporter[]       ->      Transporter[]
  // output:   Log[]   ->   LogType[]    -> Promise<WireType[]>  ->      Promise<void>
  mapperStage: Mapper<unknown[], Log[]>;
  formatterStage: Formatter<LogType>;
  reporterStage: Reporter<LogType, WireType>;
  transportStage: Transporter<WireType>;

  isSubLogger: boolean;
}

const consoleMapperFactory = (userConfig: UserConfig): Mapper<unknown[], Log[]> => chain(
  entityMapperFactory(userConfig),
  metaMapperFactory(userConfig),
  secretMapperFactory(userConfig),
);

export function consoleConfig(userConfig?: UserConfig): TsilogConfig<Surrogate[]> {
  return {
    [isConfigKey]: true,
    [isSubLoggerKey]: false,

    ...defaultUserConfig,
    ...userConfig,

    env: new EnvironmentMap(),

    mapperStage: consoleMapperFactory(userConfig ?? defaultUserConfig),
    formatterStage: templateFormatterFactory(userConfig ?? defaultUserConfig),
    reporterStage: bufferReporterFactory(userConfig ?? defaultUserConfig),
    transportStage: consoleTransporterFactory(userConfig ?? defaultUserConfig),

    // TODO: move this somewhere that makes more sense
    // TODO: Also it doesn't seem to work correctly as-is anyway
    get isSubLogger(): boolean {
      return this[isSubLoggerKey] === true;
    },
  };
}

export function subLoggerConfig<LogType extends Log[] = Log[], WireType = unknown[]>
(parent: TsilogConfig<LogType, WireType>,
 subConfig?: UserConfig): TsilogConfig<LogType, WireType> {

  const separator = subConfig?.nameSeparator ?? defaultUserConfig.nameSeparator;
  const subName = subConfig?.name ?? `sub${defaultUserConfig.name}`;
  const name = `${parent.name}${separator}${subName}`;

  return {
    ...parent,
    ...subConfig ?? defaultUserConfig,

    name,

    [isSubLoggerKey]: true,
  };
}

export function isTsilogConfig<LogType extends Log[] = Log[], WireType = unknown[]>
(value: unknown): value is TsilogConfig<LogType, WireType> {

  return value != null &&
    typeof value === 'object' &&
    isConfigKey in value &&
    value[isConfigKey] === true;
}
