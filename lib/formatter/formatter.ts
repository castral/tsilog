import type { Log } from '../facade.ts';
import type { Mapper } from '../mapper/mapper.ts';

export type Formatter<Out = Log> = Mapper<Log[], Out[]>;
