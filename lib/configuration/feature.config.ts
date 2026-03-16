import type { StringFeature } from '../support/string/string-config.support.ts';
import type { ConsoleFeature } from '../transporter/console.transporter.ts';
import type { UserConfig } from './tsilog.config.ts';

export enum BuiltinFeature {
  Console = 'console',
  Strings = 'strings',
}

// TODO: Use this to make `featureGet<T>()` safe
export interface BuiltinFeatureMap {
  [BuiltinFeature.Console]: ConsoleFeature;
  [BuiltinFeature.Strings]: StringFeature;
}

type FeatureKey<T> = T extends object ? keyof T : string;
type FeatureValue<T> = T extends object ? T[keyof T] : T;

export type FeatureEnabled = 'disabled' | 'enabled' | boolean;

export type FeatureConfig<
  T = unknown,
  Feature extends Record<FeatureKey<T>, FeatureValue<T> | undefined> = Record<FeatureKey<T>, FeatureValue<T> | undefined>,
> = Feature & {
  enabled?: boolean;
};

export type Feature<T> = FeatureConfig<T> | FeatureEnabled;

export type FeatureSettings<T = unknown> = Record<BuiltinFeature, Feature<T>>;

export function featureConfig<T>
(featureName: BuiltinFeature,
 config: Pick<UserConfig, 'features'>): FeatureConfig<T> | undefined {

  const feature = config.features?.[featureName];
  return typeof feature === 'object'
         ? feature as FeatureConfig<T>
         : undefined;
}

export function featureEnabled<T>(feature: Feature<T>): boolean | undefined {
  return typeof feature === 'string'
         ? feature === 'enabled'
         : typeof feature === 'boolean'
           ? feature
           : typeof feature === 'object' && 'enabled' in feature
             ? feature.enabled
             : undefined;
}

export function featureGet<T>(from: Feature<T>, key: FeatureKey<T>): FeatureValue<T> | undefined {
  return typeof from === 'object' ? from[key] : undefined;
}
