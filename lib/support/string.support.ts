// string with placeholder format: `%@`
// string.split('placeholder')
// string.interleave(values)
// range = [prefix.length, replacement.length]
// string.applyTo(range, Record<Attribute, Value>)

import { type JSONPrimitive, type Log, SeverityCode, SeverityName } from '../facade.ts';

export enum AttributeName {
  Background = 'background',
  Color = 'color',
  Weight = 'weight',
}

export type Range = [index: number, length: number];

export interface Attribute {
  range: Range;
  value?: JSONPrimitive | undefined;
  replacement?: string | undefined;
}

export class Surrogate implements Log {
  private readonly attributes = new Map<AttributeName, Attribute[]>();

  public readonly severity: SeverityCode | SeverityName;
  public readonly arguments: unknown[];
  public readonly context: Map<string, JSONPrimitive>;

  public constructor(log: Log,
                     public readonly template: string,
                     public readonly placeholder: string = '%@') {
    this.severity = log.severity;
    this.arguments = log.arguments;
    this.context = new Map(log.context?.entries());
  }

  public applyTo(range: Range, name: AttributeName, value?: JSONPrimitive, replacement?: string): this {
    let attributes = this.attributes.get(name);

    if (attributes === undefined) {
      attributes = [];
      this.attributes.set(name, attributes);
    }

    attributes.push({ range, value, replacement } satisfies Attribute);
    return this;
  }
}
