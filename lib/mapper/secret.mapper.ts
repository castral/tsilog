import type { Log } from '../facade.ts';
import type { Mapper } from './mapper.ts';

export const secretMapper: Mapper<Log[], Log[]> = (_input: Log[]): Log[] => {
  return [];
};
