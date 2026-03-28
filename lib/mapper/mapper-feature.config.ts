import type { FeatureEnabled } from '../configuration/feature.config.ts';

import { type SeverityCode, SeverityName } from '../facade.ts';

export enum MetaKey {
  Time = 'time',
  Stack = 'stack',
}

export interface MapperFeature extends FeatureEnabled {
  // Capture stack trace for each log or a specific severity level
  captureStack?: boolean | SeverityCode | SeverityName;
  // Override the built-in key matcher RegExp
  matcherOverride?: string;
  // Provide an additional key matcher RegExp
  additionalMatcher?: string;
  // Change the default mask value from `{{SECRET_OMITTED}}`
  maskValue?: string;
  // Provide a callback to mask complex arbitrary keys and values.
  // Return your new masked value or undefined to skip masking this key.
  maskValueCallback?: (obj: Record<PropertyKey, unknown> | unknown[] | undefined,
                       key: PropertyKey | undefined,
                       value: unknown) => string | undefined;
}
