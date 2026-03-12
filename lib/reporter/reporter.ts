import type { Log } from '../facade.ts';
import type { Mapper } from '../mapper/mapper.ts';

export type Reporter<In = Log[], Out = Log[]> = Mapper<In, Out | Promise<Out>>;
