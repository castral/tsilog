import type { UserConfig } from '../configuration/tsilog.config.ts';
import type { MapperFactory } from './mapper.ts';

import {
  BuiltinFeature,
  featureConfigFromConfig,
  isFeatureEnabled,
} from '../configuration/feature.config.ts';
import { type Log, severityMatches, SeverityName } from '../facade.ts';
import { type MappingFeature, MetaKey, type MetaMap } from './mapping-config.support.ts';

export const metaMapperFactory: MapperFactory<UserConfig, Log[], Log[]> =
  (config) => {

    const mappingConfig = featureConfigFromConfig<MappingFeature>(
      BuiltinFeature.Mapping,
      config,
    );
    const mappingEnabled = isFeatureEnabled<MappingFeature>(mappingConfig) ?? true;
    const captureStackSeverity = mappingConfig?.captureStack ?? SeverityName.TRACE;

    return (logs) => {

      return logs.map((log) => {

        const captureStackEnabled = mappingEnabled &&
          (typeof captureStackSeverity === 'boolean'
           ? captureStackSeverity
           : severityMatches(log.severity, captureStackSeverity));

        if (log.context === undefined) {
          log.context = {
            [MetaKey.Time]: Date.now(),
            [MetaKey.Stack]: captureStack(captureStackEnabled) ?? null,
          } satisfies MetaMap;
        }

        return log;
      });
    };
  };

function captureStack(enabled: boolean): string | undefined {

  if (!enabled) {
    return undefined;
  }

  const error = new Error('Capturing stack');
  Error.captureStackTrace(error, captureStack);
  return error.stack;
}
