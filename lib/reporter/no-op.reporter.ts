import type { Log } from '../facade.ts';
import type { MapperFactory } from '../mapper/mapper.ts';

export const noopReporterFactory: MapperFactory<never, Log[], void> =
  () => {
    return (_logs) => {};
  };
