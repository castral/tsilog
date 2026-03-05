import type { Mapper } from './mapper/mapper.ts';
import type { Transporter } from './transporter/transporter.ts';

import { type LevelCode, LevelName } from './facade.ts';

export interface Configuration<Log = Record<string, unknown>> {
  name: string;
  levelCutoff: LevelCode | LevelName;

  mapper: Mapper<unknown[], Log[]>;
  additionalMapper: Mapper<Log[], Log[]>;
  transporters: Transporter<Log>[];
}
