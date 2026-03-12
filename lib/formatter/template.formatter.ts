import type { Configuration } from '../configuration.ts';
import type { Log } from '../facade.ts';
import type { Formatter } from './formatter.ts';

export const templateFormatter = (_config: Partial<Configuration>): Formatter => {
  return (_logs): Log[] => {

    return [];
  };
};
