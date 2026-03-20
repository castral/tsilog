import { type JSONPrimitive, SeverityCode, type SeverityName } from '../facade.ts';

export enum MetaKey {
  Time = 'time',
  Stack = 'stack',
}

export type MetaMap = Record<MetaKey, JSONPrimitive>;

export interface MappingFeature {
  captureStack?: boolean | SeverityCode | SeverityName;
}
