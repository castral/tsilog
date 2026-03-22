import { SeverityCode, type SeverityName } from '../facade.ts';

export interface MappingFeature {
  captureStack?: boolean | SeverityCode | SeverityName;
}
