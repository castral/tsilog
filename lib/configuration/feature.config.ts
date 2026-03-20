import type { MappingFeature } from '../mapper/mapping-config.support.ts';
import type { StringFeature } from '../support/string/string-config.support.ts';
import type { ConsoleFeature } from '../transporter/console.transporter.ts';
import type { UserConfig } from './tsilog.config.ts';

export enum BuiltinFeature {
  Console = 'console',
  String = 'string',
  Mapping = 'mapping',
  Unknown = '',
}

// TODO: Use this to make `featureGet<T>()`, etc. safe
export interface BuiltinFeatureMap {
  [BuiltinFeature.Console]: ConsoleFeature;
  [BuiltinFeature.String]: StringFeature;
  [BuiltinFeature.Mapping]: MappingFeature;
  [BuiltinFeature.Unknown]: never;
}

type FeatureKey<T> = T extends object ? keyof T : string;
type FeatureValue<T> = T extends object ? T[keyof T] : T;

export type FeatureEnabled = 'disabled' | 'enabled' | boolean;

export type FeatureConfig<T = unknown> = {
  enabled?: FeatureEnabled;
} & Record<FeatureKey<T>, FeatureValue<T>>;

export type Feature<T> = FeatureConfig<T> | FeatureEnabled;

export type FeatureSettings<T = unknown> = Record<BuiltinFeature, Feature<T>>;

export function featureConfigFromConfig<T>
(featureName: BuiltinFeature,
 config: Pick<UserConfig, 'features'>): FeatureConfig<T> | undefined {

  const feature = config.features?.[featureName];
  return typeof feature === 'object'
         ? feature as FeatureConfig<T>
         : undefined;
}

export function isFeatureEnabled<T>(config: FeatureConfig<T> | undefined): boolean | undefined;
export function isFeatureEnabled<T>(config: FeatureConfig<T> | Pick<UserConfig, 'features'> | undefined, featureName: BuiltinFeature = BuiltinFeature.Unknown): boolean | undefined {

  if (config === undefined) {
    return undefined;
  }

  const feature = 'features' in config
                  ? config.features[featureName]
                  : config;

  return typeof feature === 'string'
         ? feature === 'enabled'
         : typeof feature === 'boolean'
           ? feature
           : typeof feature === 'object' && 'enabled' in feature
             ? typeof feature.enabled === 'string'
               ? feature.enabled === 'enabled'
               : feature.enabled
             : undefined;
}
