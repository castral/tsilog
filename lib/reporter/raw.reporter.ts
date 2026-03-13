import type { Log } from '../facade.ts';
import type { MapperFactory } from '../mapper/mapper.ts';

export const rawReporterFactory: MapperFactory<never, Log[], Log[]> =
  () => {
    return (logs) => logs;
  };
