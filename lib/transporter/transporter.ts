import type { Mapper } from '../mapper/mapper.ts';

export type Transporter<In> = Mapper<In | Promise<In>, void | Promise<void>>;
