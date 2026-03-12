import type { Log } from '../facade.ts';
import type { Mapper } from '../mapper/mapper.ts';

export type Transporter<In = Log[]> = Mapper<In | Promise<In>, void | Promise<void>>;
