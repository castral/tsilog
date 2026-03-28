import type { MapperFeature } from '../mapper/mapper-feature.config.ts';

import { type SeverityName } from '../facade.ts';

export interface FeatureEnabled {
  enabled?: boolean;
}

export type ConsoleImpl = Record<SeverityName, (...args: unknown[]) => void>;

export interface ConsoleFeature extends FeatureEnabled {
  implementation?: ConsoleImpl;
}

export interface StringFeature extends FeatureEnabled {
  /**
   * Placeholder should be two characters, the opener and the closer. An identifier may be
   * placed in between the two placeholder characters.
   */
  placeholder?: string;

  /**
   * The idSeparator should be a single character. Separates the placeholder identifier
   * which may be a number or a string matching the identifier pattern
   * /[a-z_][a-z0-9_-]*\/i from the optional formatting parameters.
   */
  idSeparator?: string;
}

export interface BuiltinFeatures {
  console: ConsoleFeature;
  mapper: MapperFeature;
  string: StringFeature;
}
