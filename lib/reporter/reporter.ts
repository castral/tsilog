import type { Log } from '../facade.ts';
import type { Mapper } from '../mapper/mapper.ts';

export type Reporter<LogType extends Log[] = Log[]> = Mapper<LogType, LogType | Promise<LogType>>;
