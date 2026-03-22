import type { TsilogConfig } from '../configuration/tsilog.config.ts';
import type { Log } from '../facade.ts';
import type { MapperFactory } from './mapper.ts';

import {
  BuiltinFeature,
  featureConfigFromConfig,
  isFeatureEnabled,
} from '../configuration/feature.config.ts';
import { walkObjectGraph } from '../support/type.support.ts';

export enum SecretKey {
  MatcherOverride = 'matcherOverride',
  AdditionalMatcher = 'additionalMatcher',
  MaskValue = 'maskValue',
  MaskValueCallback = 'maskValueCallback',
}

export interface SecretFeature {
  // Override built-in key matcher RegExp
  [SecretKey.MatcherOverride]?: string;
  // Provide an additional key matcher RegExp
  [SecretKey.AdditionalMatcher]?: string;
  // Change the default mask value from `{{SECRET_OMITTED}}`
  [SecretKey.MaskValue]?: string;
  // Provide a callback to mask complex arbitrary keys and values.
  // Return your new masked value or undefined to skip masking this key.
  [SecretKey.MaskValueCallback]?: (obj: Record<number | string | symbol, unknown>,
                                   key: number | string | symbol,
                                   value: unknown) => string | undefined;
}

const defaultKeyMatcher = '(?:(?:deploy(?:ment)?|secret|private|prod(?:uction)?)[-_\s]?key|pass(?:word)?|pw|(?:cc|(?:cred|deb)(?:it)?)(?:(?:[-_\s]?card)?(?:[-_\s]?num(?:ber)?)?)|cvv|secret|ssn?|soc(?:ial)?(?:[-_\s]?sec(?:urity)?)?)';

export const secretMapperFactory: MapperFactory<Omit<TsilogConfig, 'flume'>, Log[], Log[]> =
  (config) => {
    const secretConfig = featureConfigFromConfig<SecretFeature>(
      BuiltinFeature.Secret,
      config,
    );

    const secretEnabled = isFeatureEnabled(secretConfig) ?? true;
    const keyMatcher = new RegExp(
      secretConfig?.[SecretKey.MatcherOverride] ?? defaultKeyMatcher,
      'gi',
    );
    const defaultMaskValue = secretConfig?.maskValue ?? '{{SECRET_OMITTED}}';
    const additionalMatcher = secretConfig?.additionalMatcher === undefined
                              ? undefined
                              : new RegExp(secretConfig.additionalMatcher, 'gi');
    const maskValueCallback = secretConfig?.[SecretKey.MaskValueCallback];

    return (logs) => {

      if (!secretEnabled) {
        return logs;
      }

      for (const log of logs) {
        // TODO: walk array values, currently this goes no where
        walkObjectGraph(log.arguments, (obj, key, value): void => {
          if (
            typeof key === 'string'
            && (
              keyMatcher.test(key)
              || additionalMatcher.test(key)
            )
          ) {

            // TODO: try/catch this
            obj[key] = maskValueCallback === undefined
                       ? defaultMaskValue as string
                       : maskValueCallback(obj, key, value);
          }
        });
      }

      return logs;
    };
  };
