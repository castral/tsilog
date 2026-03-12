import type { Log } from '../facade.ts';
import type { Mapper } from '../mapper/mapper.ts';

export type Reporter = Mapper<Log[], Log[] | Promise<Log[]>>;
