import type { Formatter } from './formatter.js';
import type { Reporter } from './reporter.js';

export abstract class Transporter<Log, Out = string> {

  public constructor(protected readonly formatter: Formatter<Log, Out>,
                     protected readonly reporter: Reporter<Out>) {}

  public abstract transport(input: Log[]): void;
}
