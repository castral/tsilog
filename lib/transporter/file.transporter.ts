import type { Configuration } from '../configuration.ts';
import type { Log } from '../facade.ts';
import type { MapperFactory } from '../mapper/mapper.ts';
import type { Transporter } from './transporter.ts';

export const fileTransporter: MapperFactory<Log[] | Promise<Log[]>, void | Promise<void>> =
  (_config: Partial<Configuration>): Transporter => {
    return (_logs): Promise<void> => {

      return Promise.resolve();
    };
  };
