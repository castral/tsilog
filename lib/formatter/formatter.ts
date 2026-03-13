import type { Log } from '../facade.ts';
import type { Mapper } from '../mapper/mapper.ts';

export type Formatter<Out extends Log[] = Log[]> = Mapper<Log[], Out>;
