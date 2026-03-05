import type { LevelCode } from './logger.js';
import type { Mapper } from './mapper.js';
import type { Transporter } from './transporter.js';

export interface Configuration<Log = Record<string, unknown>> {
  name: string;
  levelCutoff: LevelCode;

  mapper: Mapper<unknown[], Log[]>;
  additionalMapper: Mapper<Log[], Log[]>;
  transporters: Transporter<Log>[];
}
