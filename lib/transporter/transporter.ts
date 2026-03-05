import type { Formatter } from '../formatter/formatter.ts';
import type { Reporter } from '../reporter/reporter.ts';

export abstract class Transporter<Log, Out = string> {

  public constructor(protected readonly formatter: Formatter<Log, Out>,
                     protected readonly reporter: Reporter<Out>[]) {}

  public abstract transport(input: Log[]): void;
}
