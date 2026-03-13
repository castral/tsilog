import type { Mapper } from '../mapper/mapper.ts';

export type Reporter<In, Out> = Mapper<In, Out | Promise<Out>>;
