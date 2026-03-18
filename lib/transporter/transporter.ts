import type { Log } from '../facade.ts';
import type { Mapper } from '../mapper/mapper.ts';

export type Transporter<LogType extends Log[] = Log[]> = Mapper<LogType | Promise<LogType>, void | Promise<void>>;
