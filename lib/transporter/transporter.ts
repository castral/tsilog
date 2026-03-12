import type { Log } from '../facade.ts';
import type { Mapper } from '../mapper/mapper.ts';

export type Transporter = Mapper<Log[] | Promise<Log[]>, void | Promise<void>>;
