import type { Formatter } from '../formatter/formatter.ts';
import type { Reporter } from '../reporter/reporter.ts';
import type { Transporter } from '../transporter/transporter.ts';

import { type Log, SeverityCode, type SeverityName } from '../facade.ts';
import { type Mapper } from '../mapper/mapper.ts';
import { type Environment } from '../support/env.support.ts';
import { BuiltinFeature, type FeatureSettings } from './feature.config.ts';

const isConfigKey = Symbol('tsilog.isConfig');

// This configuration interface is offered for user convenience
export interface UserConfig {
  name?: string;
  nameSeparator?: string;
  severityLimit?: SeverityCode | SeverityName;
  defaultSeverity?: SeverityCode | SeverityName;

  features?: Partial<FeatureSettings>;
}

// This is the effective default configuration fallback for all configurations
export const defaultUserConfig: Required<UserConfig> = {
  name: 'tsilog',
  nameSeparator: '.',
  severityLimit: SeverityCode.info,
  defaultSeverity: SeverityCode.info,

  features: {
    [BuiltinFeature.Console]: true,
    [BuiltinFeature.Strings]: true,
  },
};

// This is a concrete representation of any complete logger configuration
export interface TsilogConfig<
  LogType extends Log[] = Log[],
  WireType = string[],
> extends Required<UserConfig>, Record<symbol, unknown> {

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

export function createTsilogConfig<LogType extends Log[] = Log[], WireType = unknown[]>(
  config: Omit<TsilogConfig<LogType, WireType>, 'isSubLogger' | symbol>,
): TsilogConfig<LogType, WireType> {

  return {
    [isConfigKey]: true,

    ...config,
    isSubLogger: false,
  };
}

export function createSubTsilogConfig<LogType extends Log[] = Log[], WireType = unknown[]>(
  parent: TsilogConfig<LogType, WireType>,
  subConfig?: UserConfig,
): TsilogConfig<LogType, WireType> {

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

export function isTsilogConfig<LogType extends Log[] = Log[], WireType = unknown[]>
(value: unknown): value is TsilogConfig<LogType, WireType> {

  return value != null &&
    typeof value === 'object' &&
    isConfigKey in value &&
    value[isConfigKey] === true;
}
